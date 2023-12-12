/* eslint-disable no-unused-vars */
/* eslint-disable quotes */
import { Op, literal } from 'sequelize';
import { scheduleJob } from 'node-schedule';
import T3User from './models/T3User.js';
import { USER_AUTH_STATE } from './utils/constant.js';
import logger from './logger.js';
import Util from './utils/Util.js';
import T3UserDevices from './models/T3UserDevices.js';

async function a() {
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
  logger.info('resetAuthState once every server start/restart done');

}

async function b() {
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
  logger.info('resetSession every 1 minutes done');
}

async function resetSession(userFk, sessionSalt) {
  // Calculate the date and time for 30 minutes from now
  const scheduledDate = Util.surplusDate(Util.getDatetime(), 30 * 60);

  // Schedule the reset session job
  scheduleJob(scheduledDate, async () => {
    const userDevices = await T3UserDevices.findOne({ where: {
      userFk,
      sessionSalt,
      isDeleted: false,
    },
    });

    if (userDevices) {
      userDevices.sessionId = null;
      userDevices.sessionExpires = null;
      userDevices.sessionSalt = null;
      await userDevices.save();
    }
  });

  console.log(`resetSession(${userFk}, ${sessionSalt}), scheduled to run at: ${scheduledDate}`);
  logger.info(`resetSession(${userFk}, ${sessionSalt}), scheduled to run at: ${scheduledDate}`);
}

function initCron() {
  // a();
  // scheduleJob('0/1 * * * *', b);
}

export {
  initCron,
  resetSession,
};
