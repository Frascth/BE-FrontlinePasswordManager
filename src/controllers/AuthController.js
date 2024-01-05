/* eslint-disable eqeqeq */
/* eslint-disable max-len */
/* eslint-disable prefer-const */
import { Op } from 'sequelize';
import T3Otp from '../models/T3Otp.js';
import T3User from '../models/T3User.js';
import Util from '../utils/Util.js';
import { COOLDOWN, HTTP_CODE, USER_STATUS, USER_DEVICE_STATUS } from '../utils/constant.js';
import { resetSession } from '../cron.js';
import T3UserDevices from '../models/T3UserDevices.js';
import { sequelizeConn } from '../dbConnection.js';
import waConn from '../waConnection.js';

class AuthController {

  static async welcome(request, h) {
    let userDetail = await Util.getUserDetail(request);
    userDetail.userPk = await T3UserDevices.getUserPkByAuthenticatedRequest(request);
    return Util.response(h, true, 'Welcome to Frontline Password Manager', 200, userDetail);
  }

  static async isValidWaNumber(number) {
    number = number.replace(/[^0-9]/g, '');
    number += '@c.us';
    const isRegistered = await waConn.isRegisteredUser(number);
    if (!isRegistered) {
      return false;
    }

    return true;
  }

  static async logout(request, h) {
    const { pk } = request.auth.credentials;
    const sessionSalt = Util.getSessionSalt(request);
    const userDevices = await T3UserDevices.findOne({
      where: { userFk: pk, isDeleted: false, sessionSalt },
    });

    if (!userDevices) {
      return Util.response(h, false, 'Failed, user login not found', 404);
    }

    userDevices.sessionId = null;
    userDevices.sessionExpires = null;
    userDevices.sessionSalt = null;
    await userDevices.save();
    request.cookieAuth.clear();
    return Util.response(h, true, 'Success, logout', 200);

  }

  static async loginUsernamePassword(request, h) {
    let { username, password } = request.payload;
    let userDetail = await Util.getUserDetail(request);
    userDetail.userPk = await T3UserDevices.getUserPkByAuthenticatedRequest(request);

    const user = await T3User.findOne({
      where: {
        username: { [Op.iLike]: username },
        isDeleted: false,
      },
    });

    if (!user) {
      return Util.response(h, false, 'Failed, user not found', 404);
    }
    userDetail.userPk = user.pk || userDetail.userPk;

    if (user.activationKey !== USER_STATUS.ACTIVE) {
      return Util.response(h, false, 'Failed, user is not active', 403);
    }

    let isValid;
    try {
      isValid = await Util.compareHash(password, user.hashedPassword);
    } catch (error) {
      return Util.response(h, false, error, 401);
    }

    if (!isValid) {
      return Util.response(h, false, 'Failed, wrong username or password', 401);
    }

    // check is new device
    const isNewDevice = await AuthController.isNewDevice(request, userDetail);
    // await user.save();

    if (isNewDevice) {
      // create device data
      const { ipAddress, country, state, city, longitude, latitude, timezone } = userDetail;
      const verifyKey = Util.getRandomUrl();
      await T3UserDevices.create({
        userFk: user.pk,
        ipAddress,
        userAgent: Util.getRawUserAgent(request),
        longitude,
        latitude,
        timezone,
        country,
        state,
        city,
        verifyKey,
        mapImageSrc: Util.getStaticMapImageUrl(longitude, latitude),
      });
      // send email alert here
      user.alertNewDeviceLogin(userDetail, verifyKey);
    } else {
      request.payload.userPk = user.pk;
      const resultSendOtp = await AuthController.sendOtp(request, h);
      if (resultSendOtp.statusCode === HTTP_CODE.TOO_MANY_REQUEST) {
        return Util.response(h, true, `Success, login success otp has been sent ${resultSendOtp.source.data.lastOtpSentAt} ${COOLDOWN.OTP.FORMAT} ago`, 200, { isNewDevice });
      }
    }

    return Util.response(h, true, 'Success, login success', 200, { isNewDevice });

  }

  /**
 *
 * @param {object} userDetail
 * @returns boolean
 */
  static async isNewDevice(request, userDetail) {
    let {
      ipAddress,
      country,
      state,
      city,
      userAgent,
    } = userDetail;

    const userPk = await T3UserDevices.getUserPkByAuthenticatedRequest(request);

    const devices = await T3UserDevices.findOne({
      where: {
        userFk: userPk,
        isDeleted: false,
        verifyKey: USER_DEVICE_STATUS.AUTHENTICATED,
        [Op.or]: [
          { [Op.and]: [{ userAgent }, { city }, { state }, { country }] },
          { [Op.and]: [{ ipAddress }, { userAgent }] },
        ],
      },
    });

    if (devices) {
      return false;
    }

    return true;

  }

  static async getUserDeviceRecord(request, userDetail) {
    let {
      ipAddress,
      country,
      state,
      city,
      userAgent,
    } = userDetail;

    const userPk = await T3UserDevices.getUserPkByAuthenticatedRequest(request);

    const devicesRecord = await T3UserDevices.findOne({
      where: {
        userPk,
        isDeleted: false,
        verifyKey: USER_DEVICE_STATUS.AUTHENTICATED,
        [Op.or]: [
          { [Op.and]: [{ userAgent }, { city }, { state }, { country }] },
          { [Op.and]: [{ ipAddress }, { userAgent }] },
        ],
      },
    });

    if (devicesRecord) {
      return devicesRecord;
    }

    return undefined;

  }

  /**
   * used for server auth
   * @param {*} request
   * @param {*} session
   * @returns
   */
  static async validateCookie(request, session) {
    const userDevices = await T3UserDevices.findOne({ where: {
      sessionSalt: session.sessionSalt, // session salt is not hashed on db so its usage is for query the right hashed session id
      isDeleted: false,
      sessionExpires: {
        [Op.gt]: Util.getDatetime(),
      },
    },
    });

    if (!userDevices) {
      return { isValid: false, credentials: null };
    }

    const valid = await Util.compareHash(session.id, userDevices.sessionId);
    if (!valid) {
      return { isValid: false, credentials: null };
    }

    return { isValid: true, credentials: { pk: userDevices.userFk } };
  }

  static async loginConfirmOtp(request, h) {
    const transaction = await sequelizeConn.transaction();
    let { username, password, otpCode } = request.payload;
    let userDetail = await Util.getUserDetail(request);
    username = username.toLowerCase();
    otpCode = otpCode.replace(/ /g, '');

    if (!username || !otpCode) {
      return Util.response(h, false, 'Failed, user not found or otp expired', 404);
    }

    const user = await T3User.findOne({
      where: { username: { [Op.iLike]: username }, isDeleted: false },
    });

    if (!user) {
      return Util.response(h, false, 'Failed, user not found or otp expired', 404);
    }

    userDetail.userPk = await T3UserDevices.getUserPkByAuthenticatedRequest(request);

    if (user.activationKey !== USER_STATUS.ACTIVE) {
      return Util.response(h, false, 'Failed, user is not active', 403);
    }

    let isValid;
    try {
      isValid = await Util.compareHash(password, user.hashedPassword);
    } catch (error) {
      return Util.response(h, false, error, 401);
    }

    if (!isValid) {
      return Util.response(h, false, 'Failed, unauthorized', 401);
    }

    // check if otp match
    const threeMinutesAgo = new Date(Util.getDatetime().getTime() - 3 * 60 * 1000);

    const otp = await T3Otp.findOne({
      where: {
        userFk: user.pk,
        // otpCode,
        isApprov: false,
        createdAt: {
          [Op.gte]: threeMinutesAgo,
          [Op.lte]: Util.getDatetime(),
        },
      },
      order: [['createdAt', 'DESC']],
    });

    if (!otp) {
      return Util.response(h, false, 'Failed, invalid or expired otp', 404);
    }

    if (await Util.compareHash(otpCode, otp.otpCode) === false) {
      return Util.response(h, false, 'Failed, invalid otp', 404);
    }

    otp.isApprov = true;
    await otp.save({ transaction });
    user.lastLoginTime = Util.getDatetime().toISOString();
    await user.save({ transaction });

    // session defining based on devices
    const sessionId = Util.generateRandomString(30);
    const sessionSalt = Util.generateRandomString(30);
    const { hashedText: hashedSessionId } = await Util.hashText(sessionId);

    const isNewDevice = await AuthController.isNewDevice(request, userDetail);

    if (isNewDevice) {
      await transaction.rollback();
      return Util.response(h, false, 'Failed, new device, location, or browser not been verified yet', HTTP_CODE.FORBIDEN);
    }

    // just find the matches and put session on that record
    const userDeviceRecord = await AuthController.getUserDeviceRecord(request, userDetail);
    if (userDeviceRecord) {
      userDeviceRecord.sessionId = hashedSessionId;
      userDeviceRecord.sessionExpires = Util.surplusDate(Util.getDatetime(), 30 * 60).toISOString();
      userDeviceRecord.sessionSalt = sessionSalt;
      await userDeviceRecord.save();
    }

    // cookie defining
    request.cookieAuth.set({ id: sessionId, sessionSalt });

    // set job for logout delete session db after 30 minutes
    resetSession(user.pk, sessionSalt);
    await transaction.commit();
    return Util.response(h, true, 'Success, login confirmed', 200, { isNewDevice });

  }

  static async sendOtp(request, h) {
    const { username, password } = request.payload;
    const user = await T3User.findOne({
      where: {
        username: { [Op.iLike]: username },
        isDeleted: false,
      },
    });
    if (!user) {
      return Util.response(h, false, 'Failed, user not found', 404);
    }

    let isValid;
    try {
      isValid = await Util.compareHash(password, user.hashedPassword);
    } catch (error) {
      return Util.response(h, false, error, 401);
    }

    if (!isValid) {
      return Util.response(h, false, 'Failed, unauthorized', 401);
    }

    const otp = await T3Otp.findOne({
      where: { userFk: user.pk, isApprov: false },
      order: [['createdAt', 'DESC']],
    });

    const lastTimeOtp = otp ? otp.createdAt : false;

    if (lastTimeOtp) {
      const isTooMany = Util.isTimeEqualorAboveInterval(lastTimeOtp, Util.getDatetime(), 3, COOLDOWN.OTP.FORMAT);
      if (!isTooMany) {
        const data = {
          lastOtpSentAt: Util.getInterval(lastTimeOtp, Util.getDatetime(), COOLDOWN.OTP.FORMAT),
        };
        return Util.response(h, false, `Failed, please wait ${COOLDOWN.OTP.TIME} ${COOLDOWN.OTP.FORMAT} to request otp`, HTTP_CODE.TOO_MANY_REQUEST, data);
      }
    }

    try {
      await T3Otp.sendOtp(user);
    } catch (error) {
      return Util.response(h, false, 'Failed, otp failed', HTTP_CODE.BAD_REQUEST);
    }

    return Util.response(h, true, 'Success, otp sent', 200);
  }

  static async sendMessageWa(request, h) {
    // dev mode only
    const { to, message } = request.payload;
    Util.sendWhatsApp(to, message);
    return Util.response(h, true, 'Success, message sent', 200);
  }

  static async sendMessageEmail(request, h) {
    // dev mode only
    const { to, subject, message } = request.payload;
    const res = await Util.sendMail(to, subject, message);
    if (!res.status) {
      return Util.response(h, false, 'Failed, email not sent', 500, res.info);
    }
    return Util.response(h, true, 'Success, email sent', 200);
  }

  static async activateAccount(request, h) {
    let userDetail = await Util.getUserDetail(request);
    const transaction = await sequelizeConn.transaction();
    const { activationKey } = request.params;
    const user = await T3User.findOne({ where: { activationKey } });

    if (!user) {
      return Util.response(h, false, 'Failed, user not found', 404);
    }

    const isExpired = Util.isTimeEqualorAboveInterval(user.updatedAt, Util.getDatetime(), 3, 'day');
    if (isExpired) {
      await user.updateActivationLink(transaction);
      user.getActivationLinkEmail();
      return Util.response(h, false, 'Failed, activation link has expired, we have sent new activation link to your email', 404);
    }
    user.activationKey = 'ACTIVE';

    try {
      await user.save({ transaction });

      // create new device based on activation activity
      const { ipAddress, country, state, city, longitude, latitude, timezone } = userDetail;
      await T3UserDevices.create({
        userFk: user.pk,
        ipAddress,
        userAgent: Util.getRawUserAgent(request),
        longitude,
        latitude,
        timezone,
        country,
        state,
        city,
        verifyKey: USER_DEVICE_STATUS.AUTHENTICATED,
        mapImageSrc: Util.getStaticMapImageUrl(longitude, latitude),
      }, { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      return Util.response(h, false, error, 500);
    }
    return Util.response(h, true, 'Success, account activated', 200);
  }

  static async verifyNewDevice(request, h) {
    const transaction = await sequelizeConn.transaction();
    const { verifyKey } = request.params;
    const userDevice = await T3UserDevices.findOne({ where: { verifyKey, isDeleted: false } });

    if (!userDevice) {
      return Util.response(h, false, 'Failed, user device not found', 404);
    }

    const isExpired = Util.isTimeEqualorAboveInterval(userDevice.updatedAt, Util.getDatetime(), COOLDOWN.OTP.TIME, 'minute');
    if (isExpired) {
      return Util.response(h, false, 'Failed, verify link has expired, please re-login', 404);
    }

    // send otp
    const user = await T3User.findOne({
      where: {
        pk: userDevice.userFk,
        isDeleted: false,
        activationKey: USER_STATUS.ACTIVE,
      },
    });
    if (!user) {
      transaction.rollback();
      return Util.response(h, false, 'Failed, user not found', 404);
    }

    try {
      userDevice.verifyKey = USER_DEVICE_STATUS.AUTHENTICATED;
      await userDevice.save({ transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      return Util.response(h, false, error, 500);
    }

    return Util.response(h, true, 'Success, new device, browser, or location verified', 200);
  }

  static async logoutAllDevices(request, h) {
    const transaction = await sequelizeConn.transaction();
    const { verifyKey } = request.params;
    const userDevice = await T3UserDevices.findOne({ where: { verifyKey, isDeleted: false } });

    if (!userDevice) {
      return Util.response(h, false, 'Failed, user device not found', 404);
    }

    const isExpired = Util.isTimeEqualorAboveInterval(userDevice.updatedAt, Util.getDatetime(), COOLDOWN.OTP.TIME, 'minute');
    if (isExpired) {
      return Util.response(h, false, 'Failed, reset password link has expired', 404);
    }

    const user = await T3User.findOne({
      where: {
        pk: userDevice.userFk,
        isDeleted: false,
        activationKey: USER_STATUS.ACTIVE,
      },
    });
    if (!user) {
      return Util.response(h, false, 'Failed, user not found', 404);
    }

    try {
      // logout from all devices
      await T3UserDevices.update(
        {
          sessionId: null,
          sessionSalt: null,
          sessionExpires: null,
        },
        {
          where: {
            userFk: user.pk,
            isDeleted: false,
            [Op.or]: [
              { sessionId: { [Op.not]: null } },
              { sessionSalt: { [Op.not]: null } },
              { sessionExpires: { [Op.not]: null } },
            ],
          },
          transaction,
        },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      return Util.response(h, false, error, 500);
    }

    return Util.response(h, true, 'Success, logout from all device', 200);
  }

  static async resetPassword(request, h) {
    const transaction = await sequelizeConn.transaction();
    const { verifyKey } = request.params;
    const userDevice = await T3UserDevices.findOne({ where: { verifyKey, isDeleted: false } });

    if (!userDevice) {
      return Util.response(h, false, 'Failed, user device not found', 404);
    }

    const isExpired = Util.isTimeEqualorAboveInterval(userDevice.updatedAt, Util.getDatetime(), COOLDOWN.OTP.TIME, 'minute');
    if (isExpired) {
      return Util.response(h, false, 'Failed, reset password link has expired', 404);
    }

    const user = await T3User.findOne({
      where: {
        pk: userDevice.userFk,
        isDeleted: false,
        activationKey: USER_STATUS.ACTIVE,
      },
    });
    if (!user) {
      return Util.response(h, false, 'Failed, user not found', 404);
    }

    try {
      // logout from all devices
      await T3UserDevices.update(
        {
          sessionId: null,
          sessionSalt: null,
          sessionExpires: null,
        },
        {
          where: {
            userFk: user.pk,
            isDeleted: false,
            [Op.or]: [
              { sessionId: { [Op.not]: null } },
              { sessionSalt: { [Op.not]: null } },
              { sessionExpires: { [Op.not]: null } },
            ],
          },
          transaction,
        },
      );

      userDevice.verifyKey = USER_DEVICE_STATUS.RESET_PASSWORD;
      await userDevice.save({ transaction });

      // set new password
      let { password } = request.payload;
      const { hashedText: hashedPassword } = await Util.hashText(password);
      user.hashedPassword = hashedPassword;
      await user.save({ transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      return Util.response(h, false, error, 500);
    }

    // send mail password reset
    // create new device with verifyKey
    // and link to reset again

    return Util.response(h, true, 'Success, reset password and logout from all device', 200);
  }

}

export default AuthController;
