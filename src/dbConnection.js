/* eslint-disable no-console */
import { config } from 'dotenv';
import { Sequelize } from 'sequelize';

// load env variable
config();

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
