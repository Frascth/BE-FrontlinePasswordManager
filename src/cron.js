/* eslint-disable quotes */
import { Op, literal } from 'sequelize';
import { scheduleJob } from 'node-schedule';
import T3User from './models/T3User.js';
import { USER_AUTH_STATE } from './utils/constant.js';

async function resetInOtpSession() {
  // every 30 minutes

  const updatePromise = [];
  const users = await T3User.findAll({
    where: {
      isDeleted: false,
      authState: USER_AUTH_STATE.IN_OTP,
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
  console.log('resetInOtpSession every 30 minutes done');
}

function initCron() {
  scheduleJob('0/30 * * * *', resetInOtpSession);
}

export default initCron;
