import autoBind from 'auto-bind';

class SongsHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    autoBind(this);
  }

  async createSongHandler(request, h) {
    this._validator.validateSongsPayload(request.payload);

    const { title, year, performer, genre, duration, albumId } = request.payload;

    const songId = await this._service.addSong({
      title,
      year,
      performer,
      genre,
      duration,
      albumId,
    });

    const response = h.response({
      status: 'success',
      data: {
        songId,
      },
    });

    response.code(201);
    return response;
  }

  async getSongsHandler(request, h) {
    const { title, performer } = request.query;
    const songs = await this._service.getSong(title, performer);

    return h.response({
      status: 'success',
      data: { songs },
    });
  }

  async getSongByIdHandler(request, h) {
    const { id } = request.params;

    const { song, isCache } = await this._service.getDetailSong(id);

    const response = h.response({
      status: 'success',
      data: {
        song,
      },
    });

    response.code(200);

    if (isCache) return response.header('X-Data-Source', 'cache');

    return response;
  }

  async updateSongHandler(request, h) {
    this._validator.validateSongsPayload(request.payload);

    const { id } = request.params;
    const { title, year, performer, genre, duration = null, albumId = null } = request.payload;

    await this._service.updateSong(id, {
      title,
      year,
      performer,
      genre,
      duration,
      albumId,
    });

    const response = h.response({
      status: 'success',
      message: 'Song has been successfully updated',
    });

    response.code(200);
    return response;
  }

  async deleteSongHandler(request, h) {
    const { id } = request.params;

    await this._service.deleteSong(id);

    const response = h.response({
      status: 'success',
      message: 'Song has been successfully deleted',
    });

    response.code(200);
    return response;
  }
}

export default SongsHandler;
