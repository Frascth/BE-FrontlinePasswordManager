/* eslint-disable quotes */
import { Op, literal } from 'sequelize';
import { scheduleJob } from 'node-schedule';
import T3User from './models/T3User.js';
import { USER_AUTH_STATE } from './utils/constant.js';

async function resetAuthState() {
  // run once every server start / restart
  const updatePromise = [];
  const users = await T3User.findAll({
    where: {
      isDeleted: false,
      authState: {
        [Op.ne]: USER_AUTH_STATE.LOGOUT,
      },
    },
  });

  if (users) {
    users.forEach((user) => {
      updatePromise.push(async () => {
        user.authState = USER_AUTH_STATE.LOGOUT;
        await user.save();
      });
    });
  }

  await Promise.all(updatePromise.map((asyncFunc) => asyncFunc()));
  console.log('resetAuthState once every server start/restart done');

}

async function resetSession() {
  // every 1 minutes
  // check if user already in otp or in login session for 30 or more minutes, then logout

  const updatePromise = [];
  const users = await T3User.findAll({
    where: {
      isDeleted: false,
      authState: {
        [Op.ne]: USER_AUTH_STATE.LOGOUT,
      },
      [Op.and]: literal(`(EXTRACT(EPOCH FROM (NOW() AT TIME ZONE 'UTC' - "updatedAt" AT TIME ZONE 'UTC')) / 60) >= 30`),
    },
  });

  if (users) {
    users.forEach((user) => {
      updatePromise.push(async () => {
        user.authState = USER_AUTH_STATE.LOGOUT;
        await user.save();
      });
    });
  }

  await Promise.all(updatePromise.map((asyncFunc) => asyncFunc()));
  console.log('resetSession every 1 minutes done');
}

function initCron() {
  resetAuthState();
  scheduleJob('0/1 * * * *', resetSession);
}

export default initCron;
