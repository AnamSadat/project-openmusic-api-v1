import Hapi from '@hapi/hapi';
import Jwt from '@hapi/jwt';
import Inert from '@hapi/inert';

// exception error
import ClientError from './exceptions/ClientError.js';

// api
import index from './api/index/index.js';
import albums from './api/albums/index.js';
import songs from './api/songs/index.js';
import users from './api/users/index.js';
import auth from './api/auth/index.js';
import playlist from './api/playlist/index.js';
import collabs from './api/collabs/index.js';
import _exports from './api/exports/index.js';

// validator
import AlbumsValidator from './validator/albums/index.js';
import SongsValidator from './validator/songs/index.js';
import UsersValidator from './validator/users/index.js';
import AuthValidator from './validator/auth/index.js';
import PlaylistValidator from './validator/playlist/index.js';
import CollabValidator from './validator/collabs/index.js';
import ExportValidator from './validator/exports/index.js';
import UploadsValidator from './validator/uploads/index.js';

// service
import AlbumServices from './services/postgres/AlbumServices.js';
import SongServices from './services/postgres/SongServices.js';
import UserServices from './services/postgres/UserServices.js';
import AuthServices from './services/postgres/AuthServices.js';
import PlaylistServices from './services/postgres/PlaylistServices.js';
import CollabServices from './services/postgres/CollabServices.js';
import ProducerServices from './services/rabbitmq/ProducerServices.js';
import StorageLocalService from './services/storage/StorageLocalServices.js';
import CacheService from './services/redis/CacheServices.js';
import StorageCloudService from './services/storage/StorageCloudServices.js';

// token
import TokenManager from './tokenize/TokenManager.js';

// utils
import config from './utils/config.js';
import colorStatus from './utils/logger.js';

const init = async () => {
  const cacheService = new CacheService();
  const albumService = new AlbumServices(cacheService);
  const songService = new SongServices(cacheService);
  const usersService = new UserServices();
  const authService = new AuthServices();
  const playlistService = new PlaylistServices(cacheService);
  const collabServices = new CollabServices();
  const storageLocalService = new StorageLocalService(`${process.cwd()}/uploads`);
  const storageCloudService = new StorageCloudService();

  const server = Hapi.server({
    port: config.app.port,
    host: config.app.node_env !== 'production' ? config.app.host : config.app.hostProd,
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  server.events.on('response', (request) => {
    const method = request.method.toUpperCase();
    const { path } = request;
    const statusCode = request.response?.statusCode ?? 500;
    const ms = request.info.responded - request.info.received;

    console.log(`${method} ${path} ${colorStatus(statusCode)} ${ms}ms`);
  });

  server.ext('onPreResponse', (request, h) => {
    const { response } = request;

    if (response instanceof ClientError) {
      console.error('[ClientError]', response);
      const newResponse = h.response({
        status: 'fail',
        message: response.message,
      });
      newResponse.code(response.statusCode);
      return newResponse;
    }

    if (response.isBoom) {
      const { statusCode } = response.output;

      switch (statusCode) {
        case 400:
          console.error('[BoomError 400] Bad Request:', response);
          break;
        case 401:
          console.error('[BoomError 401] Unauthorized:', response);
          break;
        case 403:
          console.error('[BoomError 403] Forbidden:', response);
          break;
        case 404:
          console.error('[BoomError 404] Not Found:', response);
          break;
        default:
          console.error(`[BoomError ${statusCode}]`, response);
      }

      return h.continue;
    }

    if (response instanceof Error) {
      console.error('[ServerError]', response);
      const newResponse = h.response({
        status: 'error',
        message: 'Terjadi kesalahan pada server',
      });
      newResponse.code(500);
      return newResponse;
    }

    return h.continue;
  });

  await server.register([
    {
      plugin: Jwt,
    },
    {
      plugin: Inert,
    },
  ]);

  server.auth.strategy('openmusic_jwt', 'jwt', {
    keys: config.auth.accessTokenKey,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      maxAgeSec: config.auth.accessTokenAge,
    },
    validate: (artifacts) => ({
      isValid: true,
      credentials: {
        id: artifacts.decoded.payload.id,
      },
    }),
  });

  await server.register([
    {
      plugin: index,
    },
    {
      plugin: albums,
      options: {
        albumService,
        storageLocalService,
        storageCloudService,
        validatorAlbums: AlbumsValidator,
        validatorStorage: UploadsValidator,
      },
    },
    {
      plugin: songs,
      options: {
        service: songService,
        validator: SongsValidator,
      },
    },
    {
      plugin: users,
      options: {
        service: usersService,
        validator: UsersValidator,
      },
    },
    {
      plugin: auth,
      options: {
        authService,
        usersService,
        tokenManager: TokenManager,
        validator: AuthValidator,
      },
    },
    {
      plugin: playlist,
      options: {
        playlistService,
        songService,
        validator: PlaylistValidator,
      },
    },
    {
      plugin: collabs,
      options: {
        collabServices,
        playlistService,
        usersService,
        validator: CollabValidator,
      },
    },
    {
      plugin: _exports,
      options: {
        exportService: ProducerServices,
        playlistService,
        validator: ExportValidator,
      },
    },
  ]);

  await server.start();
  console.log(`Server berjalan di ${server.info.uri}`);
};

init();
