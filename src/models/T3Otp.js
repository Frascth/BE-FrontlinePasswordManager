/* eslint-disable prefer-const */
import { DataTypes, Model } from 'sequelize';
import { sequelizeConn } from '../dbConnection.js';
import Util from '../utils/Util.js';
import T1MessageContent from './T1MessageContent.js';
import { HTML_CONTENT, MESSAGE_CONTENT, TWO_FAC_AUTH } from '../utils/constant.js';
import T1HtmlContent from './T1HtmlContent.js';

class T3Otp extends Model {

  static async sendOtp(userModel) {
    if (userModel.twoFacAuth === TWO_FAC_AUTH.TOTP_WA) {
      T3Otp.sendOtpWa(userModel);
    } else if (userModel.twoFacAuth === TWO_FAC_AUTH.TOTP_GMAIL) {
      T3Otp.sendOtpEmail(userModel);
    }
  }

  static async sendOtpWa(userModel) {
    const transaction = await sequelizeConn.transaction();

    try {
      const otpCode = Util.generateRandomNumber(6);
      const { hashedText: hashedOtpCode } = await Util.hashText(otpCode);
      await this.create({
        userFk: userModel.pk,
        otpCode: hashedOtpCode,
      }, { transaction });
      // eslint-disable-next-line max-len
      let { content: message } = await T1MessageContent.findOne({ where: { pk: MESSAGE_CONTENT.TOTP_LOGIN } });
      message = message.replace('{{otpCode}}', otpCode);
      Util.sendWhatsApp(userModel.waNumber, message);
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  }

  static async sendOtpEmail(userModel) {
    const transaction = await sequelizeConn.transaction();

    try {
      const otpCode = Util.generateRandomNumber(6);
      const { hashedText: hashedOtpCode } = await Util.hashText(otpCode);
      await T3Otp.create({
        userFk: userModel.pk,
        otpCode: hashedOtpCode,
      }, { transaction });

      // eslint-disable-next-line max-len
      let { subject, content: message } = await T1HtmlContent.findOne({ where: { pk: HTML_CONTENT.TOTP_LOGIN } });
      message = message.replace('{{otpCode}}', otpCode);
      message = message.replace('{{username}}', userModel.username);
      Util.sendMail(userModel.email, subject, message);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  }

}

T3Otp.init({
  pk: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userFk: {
    type: DataTypes.STRING(4000),
    allowNull: false,
  },
  otpCode: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  isApprov: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  sequelize: sequelizeConn,
  modelName: 'T3Otp',
  freezeTableName: true,
  timestamps: true,
});

export default T3Otp;
