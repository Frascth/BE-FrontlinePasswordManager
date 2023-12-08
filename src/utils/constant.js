import { config } from 'dotenv';

// load env variables
config();

// just change this to development or production
// the rest of constant will adapt
const ENVIRONMENT = 'development';
const CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{}|;:,.<>?';
const { ADMIN_WA_NO } = process.env;

const ROUTE = {
  LOGIN: '/login-username-password',
};

const SERVER = {
  HOST: ENVIRONMENT === 'development' ? process.env.DEV_SERVER_HOST : process.env.PROD_SERVER_HOST,
  PORT: ENVIRONMENT === 'development' ? process.env.DEV_SERVER_PORT : process.env.PROD_SERVER_PORT,
  COOKIE_NAME: process.env.COOKIE_NAME,
  COOKIE_PASSWORD: process.env.COOKIE_PASSWORD,
  ENCRYPTION_KEY_HEX: process.env.COOKIE_ENCRYPTION_KEY_HEX,
  INITIAL_VECTOR_HEX: process.env.COOKIE_INITIAL_VECTOR_HEX,
  LOG_PATH: './log',
};

const FE_SERVER = {
  HOST: ENVIRONMENT === 'development' ? process.env.DEV_SERVER_HOST : process.env.PROD_SERVER_HOST,
  PORT: ENVIRONMENT === 'development' ? process.env.DEV_SERVER_PORT : process.env.PROD_SERVER_PORT,
  COOKIE_NAME: process.env.COOKIE_NAME,
  COOKIE_PASSWORD: process.env.COOKIE_PASSWORD,
  ENCRYPTION_KEY_HEX: process.env.COOKIE_ENCRYPTION_KEY_HEX,
  INITIAL_VECTOR_HEX: process.env.COOKIE_INITIAL_VECTOR_HEX,
  LOG_PATH: './log',
};

const EMAIL = {
  HOST: ENVIRONMENT === 'development' ? process.env.DEV_EMAIL_HOST : process.env.PROD_EMAIL_HOST,
  PORT: ENVIRONMENT === 'development' ? process.env.DEV_EMAIL_PORT : process.env.PROD_EMAIL_PORT,
  USER: ENVIRONMENT === 'development' ? process.env.DEV_EMAIL_USER : process.env.PROD_EMAIL_USER,
  PASSWORD: ENVIRONMENT === 'development' ? process.env.DEV_EMAIL_PASSWORD : process.env.PROD_EMAIL_PASSWORD,
  NAME: ENVIRONMENT === 'development' ? process.env.DEV_EMAIL_NAME : process.env.PROD_EMAIL_NAME,
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
  TOTP_WA: 2,
  TOTP_GMAIL: 3,
};

const HTML_CONTENT = {
  ACCOUNT_ACTIVATION: 1,
  TOTP_LOGIN: 2,
};

const MESSAGE_CONTENT = {
  TOTP_LOGIN: 1,
};

const USER_AUTH_STATE = {
  LOGOUT: 0,
  IN_OTP: 1,
  LOGIN: 2,
};

const USER_STATUS = {
  ACTIVE: 'ACTIVE',
};

const COOLDOWN = {
  OTP: { TIME: 3, FORMAT: 'minutes' },
};

const HTTP_CODE = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  UNAUTHENTICATED: 401,
  FORBIDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUEST: 429,
};

const GLOBAL_SETTING = {
  TIMEZONE: process.env.GLOBAL_TIMEZONE,
};

export {
  ENVIRONMENT,
  CHARACTERS,
  SERVER,
  EMAIL,
  DB,
  TWO_FAC_AUTH,
  HTML_CONTENT,
  MESSAGE_CONTENT,
  ADMIN_WA_NO,
  USER_AUTH_STATE,
  USER_STATUS,
  ROUTE,
  COOLDOWN,
  HTTP_CODE,
  FE_SERVER,
  GLOBAL_SETTING,
};
