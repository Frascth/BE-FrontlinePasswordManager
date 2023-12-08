/* eslint-disable no-unused-vars */
/* eslint-disable quotes */
import { Op, literal } from 'sequelize';
import { scheduleJob } from 'node-schedule';
import T3User from './models/T3User.js';
import { USER_AUTH_STATE } from './utils/constant.js';
import logger from './logger.js';
import Util from './utils/Util.js';

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

async function resetSession(sessionSalt) {
  // Calculate the date and time for 30 minutes from now
  const scheduledDate = new Date(Util.getDatetime().getTime() + 30 * 60 * 1000);

  // Schedule the reset session job
  scheduleJob(scheduledDate, async () => {
    const user = await T3User.findOne({ where: {
      sessionSalt,
      isDeleted: false,
    },
    });

    if (user) {
      user.sessionId = null;
      user.sessionExpires = null;
      user.sessionSalt = null;
      await user.save();
    }
  });

  logger.info(`resetSession(${sessionSalt}), scheduled to run at: ${scheduledDate}`);
}

function initCron() {
  // a();
  // scheduleJob('0/1 * * * *', b);
}

export {
  initCron,
  resetSession,
};
