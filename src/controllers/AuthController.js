import T3User from '../models/T3User.js';
import Util from '../utils/Util.js';

class AuthController {

  // static async sendOtp(request, h) {
  //   const { username, to } = request.payload;
  //   const user = await T3User.findOne({ where: { username } });
  //   if (!user) {
  //     return Util.response(h, false, 'Failed, user not found', 404);
  //   }

  //   if (user.twoFacAuth === TWO_FAC_AUTH.TOTP_WA) {

  //   } else {

  //   }
  // }

  static async sendOtpWa(request, h) {
    const { to, message } = request.payload;
    await Util.sendWhatsApp(to, message);
    return Util.response(h, true, 'Success, message sent');
  }

  static async sendOtpEmail(request, h) {
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
