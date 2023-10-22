import hapi from '@hapi/hapi';
import { route } from './route.js';
import { config } from 'dotenv';

config();

async function init () {

    const server = hapi.server({
        host : process.env.SERVER_HOST,
        port : process.env.SERVER_PORT,
    });

    server.route(route);

    await server.start();
    console.log(`Server running on ${server.info.uri}`);
}

init();