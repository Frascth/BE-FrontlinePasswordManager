/* eslint-disable no-console */
import { config } from 'dotenv';
import hapi from '@hapi/hapi';
import route from './route.js';
import initDatabase from './dbConnection.js';

// load env variables
config();

async function init() {
  // set server config
  const server = hapi.server({
    host: process.env.SERVER_HOST,
    port: process.env.SERVER_PORT,
  });

  // set server routes
  server.route(route);

  // start server
  await server.start();
  console.log(`Server running on ${server.info.uri}`);

  // start db connection
  await initDatabase();
}

// init apps
init();
