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

    // use for development only
    // create a table from all of sequelize model
    // before the model can sync the controller must be imported first so model.init is executed
    // see/import controller in route.js
    // await sequelizeConn.sync({ alter: true });
    // console.log('Success sync with database');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

export { sequelizeConn, initDatabase };
