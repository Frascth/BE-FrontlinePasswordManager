import { Sequelize } from 'sequelize';
import T3Otp from '../models/T3Otp.js';
import T3User from '../models/T3User.js';
import Util from '../utils/Util.js';
import { TWO_FAC_AUTH } from '../utils/constant.js';

class AuthController {

  static async confirmOtp(request, h) {
    let { userPk, otpCode } = request.payload;
    userPk = userPk.replace(/ /g, '');
    otpCode = otpCode.replace(/ /g, '');
    if (!userPk || !otpCode) {
      return Util.response(h, false, 'Failed, user not found or otp expired', 404);
    }

    const threeMinutesAgo = new Date(Util.getUTCDateNow() - 3 * 60 * 1000);
    const { Op } = Sequelize;

    const otp = await T3Otp.findOne({
      where: {
        userFk: userPk,
        otpCode,
        createdAt: {
          [Op.gte]: threeMinutesAgo,
          [Op.lte]: new Date(),
        },
      },
      order: [['createdAt', 'DESC']],
    });

    if (!otp) {
      return Util.response(h, false, 'Failed, user not found or otp expired', 404);
    }

    otp.isApprov = true;
    await otp.save();
    return Util.response(h, true, 'Success, otp confirmed', 200);

  }

  static async sendOtp(request, h) {
    const { userPk } = request.payload;
    const user = await T3User.findOne({ where: { pk: userPk } });
    if (!user) {
      return Util.response(h, false, 'Failed, user not found', 404);
    }

    const otp = await T3Otp.findOne({
      where: { userFk: userPk },
      order: [['createdAt', 'DESC']],
    });

    const lastTimeOtp = otp.createdAt || false;

    if (lastTimeOtp) {
      const isValidRequest = Util.isDateAboveInterval(lastTimeOtp, new Date(), 3, 'minutes');
      if (!isValidRequest) {
        return Util.response(h, false, 'Failed, please wait for 3 minutes to request again', 429);
      }
    }

    if (user.twoFacAuth === TWO_FAC_AUTH.TOTP_WA) {
      await T3Otp.sendOtpWa(user.waNumber, userPk);
    } else {
      await T3Otp.sendOtpEmail(user.email, userPk);
    }

    return Util.response(h, true, 'Success, otp sent', 200);
  }

  static async sendMessageWa(request, h) {
    const { to, message } = request.payload;
    await Util.sendWhatsApp(to, message);
    return Util.response(h, true, 'Success, message sent');
  }

  static async sendMessageEmail(request, h) {
    const { to, subject, message } = request.payload;
    await Util.sendMail(to, subject, message);
    return Util.response(h, true, 'Success, email sent');
  }

  static async activateAccount(request, h) {
    const { activationKey } = request.params;
    const user = await T3User.findOne({ where: { activationKey } });

    if (!user) {
      return Util.response(h, false, 'Failed, user not found', 404);
    }

    const isExpired = Util.isDateAboveInterval(user.updatedAt, Util.getUTCDateNow(), 3, 'minute');
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
