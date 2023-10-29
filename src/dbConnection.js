/* eslint-disable no-console */
import { Sequelize } from 'sequelize';
import { DB } from './utils/constant.js';

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
  },
  dialect: 'postgres',
});

async function initDatabase() {
  try {
    await sequelizeConn.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

export { sequelizeConn, initDatabase };
