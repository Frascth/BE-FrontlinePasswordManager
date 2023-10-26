/* eslint-disable no-console */
// import { config } from 'dotenv';
import hapi from '@hapi/hapi';
import { SERVER } from './utils/Constant.js';
import route from './route.js';
import { initDatabase } from './dbConnection.js';

// // load env variables
// config();

async function init() {
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

  // set server routes
  server.route(route);

  // start server
  await server.start();
  console.log(`Server running on ${server.info.uri}`);

  // check auth db connection
  await initDatabase();

  // Create a global error handler
  server.ext('onPreResponse', (request, h) => {
    const { response } = request;
    if (response instanceof Error) {
      // Handle the error
      const error = response;

      // Add error information to the response
      response.output.payload = {
        statusCode: error.output.statusCode,
        error: error.message,
        message: 'An error occurred',
      };
    }
    return h.continue;
  });
}

// init apps
await init();
