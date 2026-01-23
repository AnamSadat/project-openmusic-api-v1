import { nanoid } from 'nanoid';
import { Pool } from 'pg';
import InvariantError from '../../exceptions/InvariantError.js';
import NotFoundError from '../../exceptions/NotFoundError.js';
import ForbiddenError from '../../exceptions/ForbiddenError.js';
import AuthError from '../../exceptions/AuthError.js';

class PlaylistServices {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  async addPlaylist(name, uername) {
    const id = `playlist-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO playlists VALUES($1, $2, $3) RETURNING id',
      values: [id, name, uername],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) throw new InvariantError('Failed to add playlist');

    return result.rows[0].id;
  }

  async getPlaylist(credentials) {
    if (!credentials || !credentials.id) {
      throw new InvariantError('User credentials are required');
    }

    const query = {
      text: `SELECT playlists.id, playlists.name, users.username
        FROM playlists
        JOIN users ON users.id = playlists.owner
        WHERE playlists.owner = $1

        UNION

        SELECT playlists.id, playlists.name, users.username
        FROM collaborations
        JOIN playlists ON collaborations.playlist_id = playlists.id
        JOIN users ON users.id = playlists.owner
        WHERE collaborations.user_id = $1;`,
      values: [credentials.id],
    };

    const result = await this._pool.query(query);

    let filteredPlaylists = result.rows;

    filteredPlaylists = filteredPlaylists.slice(0, 2);

    return filteredPlaylists;
  }

  async deletePlaylist(id) {
    if (!id) throw new InvariantError('Playlist ID is required');

    const query = {
      text: 'DELETE FROM playlists WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) console.log(`No playlist found with ID ${id}, nothing deleted`);
  }

  async addSongWithPlaylist(playlistId, songId, userId) {
    const checkSongId = await this._pool.query({
      text: 'SELECT * FROM songs WHERE id = $1',
      values: [songId],
    });

    if (!checkSongId.rows.length) throw new NotFoundError(`Song with ID ${songId} not found`);

    const checkAccess = await this._pool.query({
      text: `
    SELECT 1 FROM playlists 
    WHERE id = $1 AND owner = $2
    UNION
    SELECT 1 FROM collaborations 
    WHERE playlist_id = $1 AND user_id = $2
  `,
      values: [playlistId, userId],
    });

    if (!checkAccess.rows.length) {
      throw new ForbiddenError("You don't have access to this playlist");
    }

    const id = nanoid(16);
    const query = {
      text: 'INSERT INTO playlist_songs (id, playlist_id, song_id) VALUES($1, $2, $3) RETURNING id',
      values: [id, playlistId, songId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) throw new InvariantError('Failed to add the song to the playlist');

    await this._cacheService.delete(`playlist-songs:${playlistId}`);
  }

  async verifyPlaylistOwner(playlistId, owner) {
    const query = {
      text: 'SELECT owner FROM playlists WHERE id = $1',
      values: [playlistId],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) throw new NotFoundError(`Playlist with ID ${playlistId} not found`);

    const playlist = result.rows[0];

    if (playlist.owner !== owner) {
      throw new ForbiddenError("You don't have permission to access this playlist");
    }
  }

  async getSongByIdPlaylist(id, credentials) {
    if (!id) throw new InvariantError('Playlist ID is required');
    if (!credentials) throw new AuthError('No credentials provided');

    await this.verifyPlaylistAccess(id, credentials);

    const cacheKey = `playlist-songs:${id}`;
    const cached = await this._cacheService.get(cacheKey);

    if (cached) {
      return { playlist: JSON.parse(cached), isCache: true };
    }

    const query = {
      text: `
      SELECT playlists.id, playlists.name, users.username,
            songs.id AS song_id, songs.title, songs.performer
      FROM playlists
      JOIN users ON users.id = playlists.owner
      LEFT JOIN playlist_songs ON playlist_songs.playlist_id = playlists.id
      LEFT JOIN songs ON songs.id = playlist_songs.song_id
      WHERE playlists.id = $1
      LIMIT 2
    `,
      values: [id],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) throw new InvariantError('Failed to fetch songs from this playlist');

    const { id: playlistId, name, username } = result.rows[0];

    const songs = result.rows
      .filter((row) => row.song_id)
      .map((row) => ({
        id: row.song_id,
        title: row.title,
        performer: row.performer,
      }));

    const playlist = {
      id: playlistId,
      name,
      username,
      songs,
    };

    await this._cacheService.set(cacheKey, JSON.stringify(playlist));

    return { playlist, isCache: false };
  }

  async deleteSongByIdPlaylist(id, credentials, playlistId) {
    if (!id) throw new InvariantError('Song ID is required');
    if (!credentials) throw new AuthError('User credentials are required');

    const query = {
      text: 'DELETE FROM playlist_songs WHERE song_id = $1 AND playlist_id = $2 RETURNING id',
      values: [id, playlistId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) console.log('No song was deleted from the playlist');

    await this._cacheService.delete(`playlist-songs:${playlistId}`);
  }

  async verifyPlaylistAccess(playlistId, userId) {
    try {
      await this.verifyPlaylistOwner(playlistId, userId);
    } catch (error) {
      if (error instanceof ForbiddenError) {
        const result = await this._pool.query({
          text: 'SELECT * FROM collaborations WHERE playlist_id = $1 AND user_id = $2',
          values: [playlistId, userId],
        });

        if (!result.rows.length) {
          throw new ForbiddenError('You do not have access to this playlist');
        }
      } else {
        throw error;
      }
    }
  }

  async addActivity(playlistId, songId, credentials, action) {
    if (!playlistId) throw new InvariantError('Playlist ID is required');
    if (!songId) throw new InvariantError('Song ID is required');
    if (!credentials) throw new AuthError('Credentials are required');
    if (!action) throw new InvariantError('Action is required');

    const id = `activity-${nanoid(16)}`;
    const time = new Date().toISOString();

    const query = {
      text: 'INSERT INTO playlist_song_activities VALUES($1, $2, $3, $4, $5, $6) RETURNING id',
      values: [id, playlistId, songId, credentials, action, time],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) throw new InvariantError('Failed to add activity');
  }

  async getPlaylistByIdWithActivity(playlistId) {
    if (!playlistId) throw new InvariantError('Playlist ID is required');

    const query = {
      text: `SELECT users.username, songs.title, playlist_song_activities.action, playlist_song_activities.time
      FROM playlist_song_activities
      INNER JOIN songs ON playlist_song_activities.song_id = songs.id
      INNER JOIN users ON playlist_song_activities.user_id = users.id
      WHERE playlist_id = $1
      ORDER BY playlist_song_activities.time ASC`,
      values: [playlistId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) return [];

    const activities = result.rows.slice(-3);

    return activities;
  }
}

export default PlaylistServices;
