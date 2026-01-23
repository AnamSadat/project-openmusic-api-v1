import Joi from 'joi';

const envSchema = Joi.object({
  // App
  NODE_ENV: Joi.string().valid('development', 'production').default('development'),
  HOST: Joi.string().when('NODE_ENV', { is: 'development', then: Joi.required() }),
  HOSTPROD: Joi.string().when('NODE_ENV', { is: 'production', then: Joi.required() }),
  PORT: Joi.number().default(5000),

  // Authentication
  ACCESS_TOKEN_KEY: Joi.string().required(),
  REFRESH_TOKEN_KEY: Joi.string().required(),
  ACCESS_TOKEN_AGE: Joi.string().default('1h'),

  // RabbitMQ / AWS MQ
  RABBITMQ_SERVER: Joi.string().when('NODE_ENV', { is: 'development', then: Joi.required() }),
  AWS_AMAZONMQ: Joi.string().when('NODE_ENV', { is: 'production', then: Joi.required() }),

  // Redis / ElastiCache
  REDIS_SERVER: Joi.string().when('NODE_ENV', { is: 'development', then: Joi.required() }),
  REDIS_PORT: Joi.string().when('NODE_ENV', { is: 'development', then: Joi.required() }),
  REDIS_PASSWORD: Joi.string().allow('').optional(),
  AWS_ELASTICACHE: Joi.string().when('NODE_ENV', { is: 'production', then: Joi.required() }),

  // aws s3
  AWS_ACCESS_KEY_ID: Joi.string().when('NODE_ENV', { is: 'production', then: Joi.required() }),
  AWS_SECRET_ACCESS_KEY: Joi.string().when('NODE_ENV', { is: 'production', then: Joi.required() }),
  AWS_REGION: Joi.string().when('NODE_ENV', { is: 'production', then: Joi.required() }),
  AWS_BUCKET_NAME: Joi.string().when('NODE_ENV', { is: 'production', then: Joi.required() }),

  /**
   * @description Local
   * If using S3 in localhost
   */
  // AWS_ACCESS_KEY_ID: Joi.string().when('NODE_ENV', { is: 'development', then: Joi.required() }),
  // AWS_SECRET_ACCESS_KEY: Joi.string().when('NODE_ENV', {
  //  is: 'development', then: Joi.required() }),
  // AWS_REGION: Joi.string().when('NODE_ENV', { is: 'development', then: Joi.required() }),
  // AWS_BUCKET_NAME: Joi.string().when('NODE_ENV', { is: 'development', then: Joi.required() }),
}).unknown();

export default envSchema;
