/* eslint-disable import/no-mutable-exports */
/* eslint-disable no-console */
import UserController from './controllers/UserController.js';
import AuthController from './controllers/AuthController.js';
import { ENVIRONMENT } from './utils/constant.js';
import SafeStorageController from './controllers/SafeStorageController.js';

let route;

const prodRoute = [
  {
    method: 'POST',
    path: '/user',
    handler: UserController.createUser,
    options: {
      auth: false,
    },
  },
  {
    method: 'GET',
    path: '/activate-account/{activationKey}',
    handler: AuthController.activateAccount,
    options: {
      auth: false,
    },
  },
  {
    method: 'GET',
    path: '/verify-new-device/{verifyKey}',
    handler: AuthController.verifyNewDevice,
    options: {
      auth: false,
    },
  },
  {
    method: 'POST',
    path: '/reset-password/{verifyKey}',
    handler: AuthController.resetPassword,
    options: {
      auth: false,
    },
  },
  {
    method: 'GET',
    path: '/reset-password/{verifyKey}',
    handler: AuthController.logoutAllDevices,
    options: {
      auth: false,
    },
  },
  {
    method: 'POST',
    path: '/login-username-password',
    handler: AuthController.loginUsernamePassword,
    options: {
      auth: false,
    },
  },
  {
    method: 'POST',
    path: '/confirm-otp',
    handler: AuthController.loginConfirmOtp,
    options: {
      auth: {
        mode: 'try',
      },
    },
  },
  {
    method: 'POST',
    path: '/logout',
    handler: AuthController.logout,
  },
  {
    method: 'POST',
    path: '/save-data',
    handler: SafeStorageController.create,
  },
  {
    method: 'GET',
    path: '/datas',
    handler: SafeStorageController.getDatas,
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
      options: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/send-message/email',
      handler: AuthController.sendMessageEmail,
      options: {
        auth: false,
      },
    },
  ];

  route = devRoute.concat(prodRoute);
}

export default route;
