import { config } from 'dotenv';

// load env variables
config();

// just change this to development or production
// the rest of constant will adapt
const ENVIRONMENT = 'development';

const SERVER = {
  HOST: ENVIRONMENT === 'development' ? process.env.DEV_SERVER_HOST : process.env.PROD_SERVER_HOST,
  PORT: ENVIRONMENT === 'development' ? process.env.DEV_SERVER_PORT : process.env.PROD_SERVER_PORT,
};

const DB = {
  URL: ENVIRONMENT === 'development' ? process.env.DEV_DB_URL : process.env.PROD_DB_URL,
  USERNAME: ENVIRONMENT === 'development' ? process.env.DEV_DB_USERNAME : process.env.PROD_DB_USERNAME,
  PASSWORD: ENVIRONMENT === 'development' ? process.env.DEV_DB_PASSWORD : process.env.PROD_DB_PASSWORD,
  NAME: ENVIRONMENT === 'development' ? process.env.DEV_DB_NAME : process.env.PROD_DB_NAME,
  PORT: ENVIRONMENT === 'development' ? process.env.DEV_DB_PORT : process.env.PROD_DB_PORT,
};

const TWO_FAC_AUTH = {
  NOTHING: 0,
  FACE: 1,
  TOTP: 2,
};

const HTML_CONTENT = {
  ACCOUNT_ACTIVATION: 1,
};

export { ENVIRONMENT, SERVER, DB, TWO_FAC_AUTH, HTML_CONTENT };
