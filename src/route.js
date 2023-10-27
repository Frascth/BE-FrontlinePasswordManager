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
];

route = prodRoute;

if (ENVIRONMENT === 'development') {
  // add route that only for development or testing
  const devRoute = [
    {
      method: 'POST',
      path: '/test-otp/wa',
      handler: AuthController.sendOtpWa,
    },
    {
      method: 'POST',
      path: '/test-otp/email',
      handler: AuthController.sendOtpEmail,
    },
  ];

  route = devRoute.concat(prodRoute);
}

export default route;
