/* eslint-disable max-len */
/* eslint-disable prefer-const */
import { Op } from 'sequelize';
import T3Otp from '../models/T3Otp.js';
import T3User from '../models/T3User.js';
import Util from '../utils/Util.js';
import { TWO_FAC_AUTH, USER_AUTH_STATE, USER_STATUS, ROUTE } from '../utils/constant.js';

class AuthController {

  static async logout(request, h) {
    const { pk } = request.auth.credentials;
    const user = await T3User.findOne({
      where: { pk, isDeleted: false, authState: USER_AUTH_STATE.LOGIN },
    });

    if (!user) {
      return Util.response(h, false, 'Failed, user login not found', 404);
    }

    user.authState = USER_AUTH_STATE.LOGOUT;
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

    if (user.authState === USER_AUTH_STATE.LOGIN && Util.isCookiePresent(request)) {
      return Util.response(h, false, 'Failed, user already login', 401);
    }

    request.payload.userPk = user.pk;
    const resultSendOtp = await AuthController.sendOtp(request, h);
    if (!resultSendOtp.source.status) {
      return resultSendOtp;
    }

    user.authState = USER_AUTH_STATE.IN_OTP;
    await user.save();

    return Util.response(h, true, 'Success, login success', 200);

  }

  /**
   * used for server auth
   * @param {*} request
   * @param {*} session
   * @returns
   */
  static async validateCookie(request, session) {
    const user = await T3User.findOne({ where: { pk: Util.decryptText(session.id) } });
    if (!user) {
      return { isValid: false };
    }

    return { isValid: true, credentials: user };
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

    if (user.authState === USER_AUTH_STATE.LOGIN && Util.isCookiePresent(request)) {
      return Util.response(h, false, 'Failed, user already login', 401);
    }

    if (user.authState !== USER_AUTH_STATE.IN_OTP) {
      return Util.response(h, false, 'Failed, otp session expired please re-login', 401);
    }

    const threeMinutesAgo = new Date(Util.getUTCDateNow() - 3 * 60 * 1000);

    const otp = await T3Otp.findOne({
      where: {
        userFk: user.pk,
        // otpCode,
        isApprov: false,
        createdAt: {
          [Op.gte]: threeMinutesAgo,
          [Op.lte]: new Date(),
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
    user.authState = USER_AUTH_STATE.LOGIN;
    user.lastLoginTime = Util.getUTCDateNow();
    await user.save();

    // cookie defining
    request.cookieAuth.set({ id: Util.encryptText(user.pk) });
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

    if (user.authState === USER_AUTH_STATE.LOGIN && Util.isCookiePresent(request)) {
      return Util.response(h, false, 'Failed, user already login', 401);
    }

    if (user.authState !== USER_AUTH_STATE.IN_OTP && request.url.pathname !== ROUTE.LOGIN) {
      return Util.response(h, false, 'Failed, session expired please re-login', 401);
    }

    const otp = await T3Otp.findOne({
      where: { userFk: user.pk, isApprov: false },
      order: [['createdAt', 'DESC']],
    });

    const lastTimeOtp = otp ? otp.createdAt : false;

    if (lastTimeOtp) {
      const isValidRequest = Util.isDateAboveInterval(lastTimeOtp, new Date(), 3, 'minutes');
      if (!isValidRequest) {
        return Util.response(h, false, 'Failed, please wait for 3 minutes to request again', 429);
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

    const isExpired = Util.isDateAboveInterval(user.updatedAt, Util.getUTCDateNow(), 3, 'day');
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
