/* eslint-disable no-console */
import hapi from '@hapi/hapi';
import hapiAuthCookie from '@hapi/cookie';
import { SERVER, ENVIRONMENT, FE_SERVER } from './utils/constant.js';
import route from './route.js';
import { initDatabase } from './dbConnection.js';
import { applyModelsAssociation, defineAllModel, syncModelWithDb } from './modelSync.js';
import waConn from './waConnection.js';
import { initCron } from './cron.js';
import logger from './logger.js';
import AuthController from './controllers/AuthController.js';

async function init() {
  // check auth db connection
  await initDatabase();

  // define all model
  defineAllModel();

  // apply configure assoc each model and table
  applyModelsAssociation();

  // sync sequelize model with db table
  syncModelWithDb();

  // check auth wa connection
  waConn.initialize();

  // set server config
  const server = hapi.server({
    host: SERVER.HOST,
    port: SERVER.PORT,
    routes: {
      payload: {
        parse: true,
        allow: 'multipart/form-data',
        multipart: { output: 'stream' },
      },
      cors: {
        origin: ENVIRONMENT === 'development' ? ['*'] : ['*'], // Replace with your allowed origins or use '*' for any origin
        additionalHeaders: ['cache-control', 'x-requested-with'],
      },
    },
    app: {
      proxy: {
        trust: true,
      },
    },
  });

  // set server auth
  await server.register(hapiAuthCookie);
  server.auth.strategy('session', 'cookie', {
    cookie: {
      strictHeader: true,
      isSameSite: 'Strict', // handle csrf
      clearInvalid: true,
      name: SERVER.COOKIE_NAME,
      password: SERVER.COOKIE_PASSWORD,
      isSecure: ENVIRONMENT === 'production', // if production then true
      ttl: ENVIRONMENT === 'development' ? 12 * 3600 * 1000 : 30 * 60 * 1000,
      isHttpOnly: true, // handle xss
    },
    redirectTo: '/login-username-password',
    validate: AuthController.validateCookie,
  });
  server.auth.default('session');

  // set server routes
  server.route(route);

  // start server
  await server.start();
  console.log(`Server running on ${server.info.uri}`);
  logger.info(`Server running on ${server.info.uri}`);

  // init cron
  initCron();

  // Create a global error handler
  server.ext('onPreResponse', (request, h) => {
    const { response } = request;
    if (response instanceof Error) {
      // Handle the error
      const error = response;

      // Add error information to the response
      response.output.payload = {
        statusCode: error.output.statusCode,
        error: ENVIRONMENT === 'development' ? error : error.message,
        message: ENVIRONMENT === 'development' ? error.message : 'An error occurred',
      };

      // log the error
      console.log(error);
      logger.error(error);
    }
    return h.continue;
  });
}

// init apps
await init();
