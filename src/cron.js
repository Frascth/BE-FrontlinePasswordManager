/* eslint-disable no-unused-vars */
/* eslint-disable quotes */
import { Op, literal } from 'sequelize';
import { scheduleJob } from 'node-schedule';
import { TP_API, USER_AUTH_STATE } from './utils/constant.js';
import logger from './logger.js';
import Util from './utils/Util.js';
import T3UserDevices from './models/T3UserDevices.js';

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
