/* eslint-disable no-console */
import UserController from './controllers/UserController.js';

const route = [
  {
    method: 'POST',
    path: '/user',
    handler: UserController.createUser,
  },
  {
    method: '*',
    path: '/',
    handler: () => 'Welcome to Frontline Password Manager',
  },
];

export default route;
