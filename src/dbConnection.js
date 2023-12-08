/* eslint-disable no-console */
import { Sequelize } from 'sequelize';
import { DB, GLOBAL_SETTING } from './utils/constant.js';
import logger from './logger.js';

const sequelizeConn = new Sequelize({
  database: DB.NAME,
  username: DB.USERNAME,
  password: DB.PASSWORD,
  host: DB.URL, // RDS endpoint
  port: DB.PORT, // PostgreSQL default port
  dialectOptions: {
    ssl: {
      require: true, // Use SSL
      rejectUnauthorized: false, // For self-signed certificates, set this to false
    },
    useUTC: GLOBAL_SETTING.TIMEZONE === 'UTC',
  },
  timezone: GLOBAL_SETTING.TIMEZONE,
  dialect: 'postgres',
  logging: (msg) => logger.info(msg),
});

async function initDatabase() {
  try {
    await sequelizeConn.authenticate();
    console.log('Database connection has been established successfully.');
    logger.info('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    logger.error(`Unable to connect to the database: ${error}`);
  }
}

export { sequelizeConn, initDatabase };
