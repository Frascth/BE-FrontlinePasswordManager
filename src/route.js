/* eslint-disable no-console */
import UserController from './controllers/UserController.js';

const route = [
  {
    method: 'POST',
    path: '/user',
    handler: UserController.createUser,
  },
  {
    method: 'GET',
    path: '/activate-account/{activationKey}',
    handler: UserController.activateAccount,
  },
];

export default route;
