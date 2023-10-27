/* eslint-disable no-console */
import hapi from '@hapi/hapi';
import { SERVER } from './utils/constant.js';
import route from './route.js';
import { initDatabase } from './dbConnection.js';
import waConn from './waConnection.js';

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

  // check auth wa connection
  await waConn.initialize();
  // const isRegistered = await waConn.isRegisteredUser('6285607060067@c.us');
  // console.log('isregistered', isRegistered);
  // if (isRegistered) {
  //   try {
  //     // await waConn.sendMessage('6285607060067@c.us', '11111');
  //   } catch (err) {
  //     console.log(err);
  //   }
  //   console.log('disini');
  // }

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
