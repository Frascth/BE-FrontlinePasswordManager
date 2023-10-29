/* eslint-disable import/no-mutable-exports */
/* eslint-disable no-console */
import UserController from './controllers/UserController.js';
import AuthController from './controllers/AuthController.js';
import { ENVIRONMENT } from './utils/constant.js';

let route;

const prodRoute = [
  {
    method: 'POST',
    path: '/user',
    handler: UserController.createUser,
  },
  {
    method: 'GET',
    path: '/activate-account/{activationKey}',
    handler: AuthController.activateAccount,
  },
  {
    method: 'POST',
    path: '/send-otp',
    handler: AuthController.sendOtp,
  },
  {
    method: 'PUT',
    path: '/confirm-otp',
    handler: AuthController.confirmOtp,
  },
];

route = prodRoute;

if (ENVIRONMENT === 'development') {
  // add route that only for development or testing
  const devRoute = [
    {
      method: 'POST',
      path: '/send-message/wa',
      handler: AuthController.sendMessageWa,
    },

    {
      method: 'POST',
      path: '/send-message/email',
      handler: AuthController.sendMessageEmail,
    },
  ];

  route = devRoute.concat(prodRoute);
}

export default route;
