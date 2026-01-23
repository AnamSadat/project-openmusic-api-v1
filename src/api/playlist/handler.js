import autoBind from 'auto-bind';
import InvariantError from '../../exceptions/InvariantError.js';

class PlaylistHandler {
  constructor(playlistService, songService, validator) {
    this._playlistService = playlistService;
    this._songService = songService;
    this._validator = validator;

    autoBind(this);
  }

  async createPlaylistHandler(request, h) {
    this._validator.validatePlaylistPayload(request.payload);

    if (!request.payload) throw new InvariantError('error');

    const { name } = request.payload;
    const { id: credentials } = request.auth.credentials;

    const playlistId = await this._playlistService.addPlaylist(name, credentials);

    const response = h
      .response({
        status: 'success',
        data: {
          playlistId,
        },
      })
      .code(201);

    return response;
  }

  async getAllPlaylistHandler(request, h) {
    const credentials = await request.auth.credentials;
    const playlists = await this._playlistService.getPlaylist(credentials);

    const response = h
      .response({
        status: 'success',
        data: {
          playlists,
        },
      })
      .code(200);

    return response;
  }

  async postPlaylistSongByIdHandler(request, h) {
    this._validator.validateSongPlaylistPayload(request.payload);

    const { songId } = request.payload;
    const { id: playlistId } = request.params;
    const { id: credentials } = request.auth.credentials;

    await this._songService.getDetailSong(songId);
    await this._playlistService.addSongWithPlaylist(playlistId, songId, credentials);
    await this._playlistService.addActivity(playlistId, songId, credentials, 'add');

    const response = h
      .response({
        status: 'success',
        message: 'Song has been successfully added to the playlist',
      })
      .code(201);

    return response;
  }

  async getSongByIdPlaylistHandler(request, h) {
    const { id: credentials } = request.auth.credentials;
    const { id } = request.params;

    const { playlist, isCache } = await this._playlistService.getSongByIdPlaylist(id, credentials);

    const response = h
      .response({
        status: 'success',
        data: {
          playlist,
        },
      })
      .code(200);

    if (isCache) return response.header('X-Data-Source', 'cache');

    return response;
  }

  async deleteSongByIdPlaylistHandler(request, h) {
    this._validator.validateSongPlaylistPayload(request.payload);

    const { id: credentials } = request.auth.credentials;
    const { songId } = request.payload;
    const { id } = request.params;

    await this._playlistService.verifyPlaylistAccess(id, credentials);
    await this._playlistService.deleteSongByIdPlaylist(songId, credentials, id);
    await this._playlistService.addActivity(id, songId, credentials, 'delete');

    const response = h
      .response({
        status: 'success',
        message: 'Song has been successfully removed from the playlist',
      })
      .code(200);

    return response;
  }

  async deletePlaylistHandler(request, h) {
    const { id } = request.params;
    const { id: credentials } = request.auth.credentials;

    await this._playlistService.verifyPlaylistOwner(id, credentials);
    await this._playlistService.deletePlaylist(id);

    const response = h
      .response({
        status: 'success',
        message: 'Playlist has been successfully deleted',
      })
      .code(200);

    return response;
  }

  async getPlaylistByIdWithActivityHandler(request, h) {
    const { id } = request.params;
    const { id: credentials } = request.auth.credentials;

    await this._playlistService.verifyPlaylistAccess(id, credentials);
    const activities = await this._playlistService.getPlaylistByIdWithActivity(id);

    const response = h
      .response({
        status: 'success',
        data: {
          playlistId: id,
          activities,
        },
      })
      .code(200);

    return response;
  }
}

export default PlaylistHandler;
