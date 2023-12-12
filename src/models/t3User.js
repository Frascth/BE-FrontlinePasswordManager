/* eslint-disable prefer-const */
import { DataTypes, Model } from 'sequelize';
import { nanoid } from 'nanoid';
import { sequelizeConn } from '../dbConnection.js';
import T1HtmlContent from './T1HtmlContent.js';
import { HTML_CONTENT, SERVER } from '../utils/constant.js';
import Util from '../utils/Util.js';

class T3User extends Model {

  async generatePk() {
    let newPk = nanoid(21);
    let isExist = await T3User.findOne({ where: { pk: newPk } });
    let tryCount = 0;

    while (isExist && tryCount < 3) {
      newPk = nanoid(21);
      isExist = await T3User.findOne({ where: { pk: newPk } });
      tryCount += 1;
    }

    return newPk;
  }

  async getActivationLinkEmail() {
    // send activation link to user email
    let { subject, content } = await T1HtmlContent.findOne({
      attributes: ['subject', 'content'],
      where: {
        pk: HTML_CONTENT.ACCOUNT_ACTIVATION,
      },
    });

    content = content.replace(/{{username}}/g, this.username);
    content = content.replace(/{{activationLink}}/g, `http://${SERVER.HOST}:${SERVER.PORT}/activate-account/${this.activationKey}`);

    Util.sendMail(this.email, subject, content);
  }

  async alertNewDeviceLogin(userDetail, verifyKey) {
    let { subject, content } = await T1HtmlContent.findOne({
      attributes: ['subject', 'content'],
      where: {
        pk: HTML_CONTENT.NEW_DEVICE_LOGIN,
      },
    });

    const { ipAddress, city, state, country, userAgentParsed, latitude, longitude } = userDetail;
    const base64Image = await Util.getImageAsBase64(Util.getStaticMapImageUrl(longitude, latitude));
    const uniqueId = Util.getRandomUrl(7);

    content = content.replace(/{{username}}/g, this.username);
    content = content.replace(/{{ipAddress}}/g, ipAddress);
    content = content.replace(/{{location}}/g, `${city}, ${state}, ${country}`);
    content = content.replace(/{{deviceDetail}}/g, `${userAgentParsed.device} via ${userAgentParsed.browser}`);
    content = content.replace(/{{uid}}/g, uniqueId);
    content = content.replace(/{{altText}}/g, `${city}, ${state}, ${country}`);
    content = content.replace(/{{verifyNewDevices}}/g, `http://${SERVER.HOST}:${SERVER.PORT}/verify-new-device/${verifyKey}`);

    // attachment for inline image
    const attachments = [
      {
        filename: 'New Device Location.jpg',
        path: base64Image,
        cid: uniqueId, // Content-ID for inline reference
      },
    ];

    Util.sendMail(this.email, subject, content, '', attachments);
  }

  async updateActivationLink(transaction) {
    this.activationKey = Util.getRandomUrl();
    this.save(transaction);
  }

}

T3User.init({
  pk: {
    type: DataTypes.STRING(4000),
    primaryKey: true,
    autoIncrement: false,
  },
  username: {
    type: DataTypes.STRING(500),
    allowNull: false,
    unique: {
      name: 'unique_username',
      msg: 'Username already used',
    },
    validate: {
      is: /^[a-zA-Z0-9-]+$/,
    },
  },
  email: {
    type: DataTypes.STRING(500),
    allowNull: false,
    unique: {
      name: 'unique_email',
      msg: 'Email already used',
    },
    validate: {
      isEmail: true,
    },
  },
  hashedPassword: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  activationKey: {
    type: DataTypes.STRING(4000),
    allowNull: false,
  },
  twoFacAuth: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  waNumber: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  authState: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  lastLoginTime: {
    type: DataTypes.DATE,
  },
  deletedAt: {
    type: DataTypes.DATE,
  },
  createdBy: {
    type: DataTypes.STRING(4000),
    allowNull: false,
  },
  updatedBy: {
    type: DataTypes.STRING(4000),
    allowNull: false,
  },
  deletedBy: {
    type: DataTypes.STRING(4000),
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  sequelize: sequelizeConn,
  modelName: 'T3User',
  freezeTableName: true,
  timestamps: true,
});

T3User.beforeSave(async (t3User) => {
  const newPk = await t3User.generatePk();
  t3User.pk = newPk;
});

export default T3User;
