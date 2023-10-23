/* eslint-disable no-console */
import { Sequelize } from 'sequelize';
import defineT3Tests from './models/t3Test.js';

async function initDatabase() {
  const sequelizeConn = new Sequelize({
    database: process.env.DB_NAME,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_URL, // RDS endpoint
    port: 5432, // PostgreSQL default port
    dialectOptions: {
      ssl: {
        require: true, // Use SSL
        rejectUnauthorized: false, // For self-signed certificates, set this to false
      },
    },
    dialect: 'postgres',
  });

  try {
    await sequelizeConn.authenticate();
    console.log('Database connection has been established successfully.');

    defineT3Tests(sequelizeConn);

    await sequelizeConn.sync();
    console.log('Success sync with database');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

export default initDatabase;
