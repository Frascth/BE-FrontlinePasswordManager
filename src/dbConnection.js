/* eslint-disable no-console */
// import { config } from 'dotenv';
import { Sequelize } from 'sequelize';
import { DB } from './utils/Constant.js';

// // load env variable
// config();

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

    // use for development only
    // create a table from sequelize model
    // await sequelizeConn.sync({ alter: true });
    // console.log('Success sync with database');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

export { sequelizeConn, initDatabase };
