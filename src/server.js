/* eslint-disable no-console */
import { config } from 'dotenv';
import hapi from '@hapi/hapi';
import route from './route';

config();

async function init() {
  const server = hapi.server({
    host: process.env.SERVER_HOST,
    port: process.env.SERVER_PORT,
  });

  server.route(route);

  await server.start();
  console.log(`Server running on ${server.info.uri}`);
}

init();
