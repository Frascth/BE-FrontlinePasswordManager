/* eslint-disable eqeqeq */
/* eslint-disable max-len */
/* eslint-disable prefer-const */
import { Op } from 'sequelize';
import T3Otp from '../models/T3Otp.js';
import T3User from '../models/T3User.js';
import Util from '../utils/Util.js';
import { COOLDOWN, HTTP_CODE, TWO_FAC_AUTH, USER_STATUS } from '../utils/constant.js';
import { resetSession } from '../cron.js';
import T3UserDevices from '../models/T3UserDevices.js';

class AuthController {

  static async logout(request, h) {
    const { pk } = request.auth.credentials;
    const user = await T3User.findOne({
      where: { pk, isDeleted: false },
    });

    if (!user) {
      return Util.response(h, false, 'Failed, user login not found', 404);
    }

    user.sessionId = null;
    user.sessionExpires = null;
    user.sessionSalt = null;
    await user.save();
    request.cookieAuth.clear();
    return Util.response(h, true, 'Success, logout', 200);

  }

  static async loginUsernamePassword(request, h) {
    let { username, password } = request.payload;
    const user = await T3User.findOne({
      where: {
        username: { [Op.iLike]: username },
        isDeleted: false,
      },
    });

    if (!user) {
      return Util.response(h, false, 'Failed, user not found', 404);
    }

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

    request.payload.userPk = user.pk;
    const resultSendOtp = await AuthController.sendOtp(request, h);
    if (resultSendOtp.statusCode === HTTP_CODE.TOO_MANY_REQUEST) {
      return Util.response(h, true, `Success, login success otp has been sent ${resultSendOtp.source.data.lastOtpSentAt} ${COOLDOWN.OTP.FORMAT} ago`, 200);
    }

    await user.save();

    // check is new device
    const isNewDevice = AuthController.isNewDevice(request);
    if (isNewDevice) {
      // send email alert here
      //
    }

    return Util.response(h, true, 'Success, login success', 200);

  }

  static async isNewDevice(request) {
    const userFk = Util.getUserPk(request);
    const ip = Util.getUserIp(request);
    const { country, regionName: state, city } = await Util.getUserLocation(ip);
    const userAgent = Util.getRawUserAgent(request);

    const devices = await T3UserDevices.findOne({
      where: {
        userFk,
        isDeleted: false,
        [Op.or]: [
          { [Op.and]: [{ userAgent }, { city }, { state }, { country }] },
          { [Op.and]: [{ ip }, { userAgent }] },
        ],
      },
    });

    if (devices) {
      return false;
    }

    return true;

  }

  /**
   * used for server auth
   * @param {*} request
   * @param {*} session
   * @returns
   */
  static async validateCookie(request, session) {
    const user = await T3User.findOne({ where: {
      sessionSalt: session.sessionSalt,
      isDeleted: false,
      sessionExpires: {
        [Op.gt]: Util.getDatetime(),
      },
    },
    });

    if (!user) {
      return { isValid: false, credentials: null };
    }

    const valid = await Util.compareHash(session.id, user.sessionId);
    if (!valid) {
      return { isValid: false, credentials: null };
    }

    return { isValid: true, credentials: { pk: user.pk } };
  }

  static async loginConfirmOtp(request, h) {
    let { username, password, otpCode } = request.payload;
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
    await otp.save();
    user.lastLoginTime = Util.getDatetime().toISOString();
    // cookie defining
    const sessionId = Util.generateRandomString(30);
    const sessionSalt = Util.generateRandomString(30);

    // session defining
    const { hashedText: hashedSessionId } = await Util.hashText(sessionId);
    user.sessionId = hashedSessionId;
    user.sessionExpires = Util.surplusDate(Util.getDatetime(), 30 * 60).toISOString();
    user.sessionSalt = sessionSalt;
    await user.save();

    request.cookieAuth.set({ id: sessionId, sessionSalt });

    // set job for logout delete session db after 30 minutes
    resetSession(sessionSalt);
    return Util.response(h, true, 'Success, login confirmed', 200);

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

    if (user.twoFacAuth === TWO_FAC_AUTH.TOTP_WA) {
      await T3Otp.sendOtpWa(user.waNumber, user.pk);
    } else if (user.twoFacAuth === TWO_FAC_AUTH.TOTP_GMAIL) {
      await T3Otp.sendOtpEmail(user.email, user.pk);
    } else {
      return Util.response(h, false, 'Failed, user doesn"t have valid otp method', 404);
    }

    return Util.response(h, true, 'Success, otp sent', 200);
  }

  static async sendMessageWa(request, h) {
    const { to, message } = request.payload;
    await Util.sendWhatsApp(to, message);
    return Util.response(h, true, 'Success, message sent', 200);
  }

  static async sendMessageEmail(request, h) {
    const { to, subject, message } = request.payload;
    const res = await Util.sendMail(to, subject, message);
    console.log(res);
    if (!res.status) {
      return Util.response(h, false, 'Failed, email not sent', 500, res.info);
    }
    return Util.response(h, true, 'Success, email sent', 200);
  }

  static async activateAccount(request, h) {
    const { activationKey } = request.params;
    const user = await T3User.findOne({ where: { activationKey } });

    if (!user) {
      return Util.response(h, false, 'Failed, user not found', 404);
    }

    const isExpired = Util.isTimeEqualorAboveInterval(user.updatedAt, Util.getDatetime(), 3, 'day');
    if (isExpired) {
      await user.updateActivationLink();
      await user.getActivationLinkEmail();
      return Util.response(h, false, 'Failed, activation link has expired, we have sent new activation link to your email', 404);
    }
    user.activationKey = 'ACTIVE';

    try {
      await user.save();
    } catch (error) {
      return Util.response(h, false, error, 500);
    }
    return Util.response(h, true, 'Success, account activated', 200);
  }

}

export default AuthController;
