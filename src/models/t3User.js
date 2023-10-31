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
      newPk = nanoid(24);
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

  async updateActivationLink() {
    this.activationKey = Util.generateActivationKey(this.username);
    this.save();
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
  salt: {
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
