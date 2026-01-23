import dotenv from 'dotenv';
import EnvironmentValidation from '../validator/env/index.js';

const envFile = process.env.NODE_ENV !== 'production' ? '.env.development' : '.env.production';

dotenv.config({ path: envFile });

const validation = EnvironmentValidation.validateEnv();

const config = {
  app: {
    node_env: validation.NODE_ENV,
    host: validation.HOST,
    hostProd: validation.HOSTPROD,
    port: validation.PORT,
  },
  auth: {
    accessTokenKey: validation.ACCESS_TOKEN_KEY,
    refreshTokenKey: validation.REFRESH_TOKEN_KEY,
    accessTokenAge: validation.ACCESS_TOKEN_AGE,
  },
  rabbitMq: {
    server:
      validation.NODE_ENV !== 'production' ? validation.RABBITMQ_SERVER : validation.AWS_AMAZONMQ,
  },
  redis: {
    host:
      validation.NODE_ENV !== 'production' ? validation.REDIS_SERVER : validation.AWS_ELASTICACHE,
    port: validation.REDIS_PORT,
    password: validation.REDIS_PASSWORD,
  },
  aws: {
    s3: {
      accessKeyId: validation.AWS_ACCESS_KEY_ID,
      secretAccessKey: validation.AWS_SECRET_ACCESS_KEY,
      region: validation.AWS_REGION,
      bucket: validation.AWS_BUCKET_NAME,
    },
  },
};

export default config;
