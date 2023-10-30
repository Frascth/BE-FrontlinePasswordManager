/* eslint-disable no-console */
import hapi from '@hapi/hapi';
import hapiAuthCookie from '@hapi/cookie';
import { v4 as uuidv4 } from 'uuid';
import { SERVER, ENVIRONMENT } from './utils/constant.js';
import route from './route.js';
import { initDatabase } from './dbConnection.js';
import { applyModelsAssociation, defineAllModel, syncModelWithDb } from './modelSync.js';
import waConn from './waConnection.js';
import AuthController from './controllers/AuthController.js';

async function init() {
  // check auth db connection
  await initDatabase();

  // define all model
  await defineAllModel();

  // apply configure assoc each model and table
  await applyModelsAssociation();

  // sync sequelize model with db table
  await syncModelWithDb();

  // check auth wa connection
  await waConn.initialize();
  console.log('WhatsApp connection is ready!');

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
    },
  });

  // set server auth
  await server.register(hapiAuthCookie);
  server.auth.strategy('session', 'cookie', {
    cookie: {
      name: uuidv4(),
      password: SERVER.COOKIE_PASSWORD,
      isSecure: false,
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
        message: 'An error occurred',
      };
    }
    return h.continue;
  });
}

// init apps
await init();
