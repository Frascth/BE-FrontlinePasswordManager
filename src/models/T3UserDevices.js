/* eslint-disable prefer-const */
import { nanoid } from 'nanoid';
import { DataTypes, Model } from 'sequelize';
import { sequelizeConn } from '../dbConnection.js';

class T3UserDevices extends Model {

  async generatePk() {
    let newPk = nanoid(21);
    let isExist = await T3UserDevices.findOne({ where: { pk: newPk } });
    let tryCount = 0;

    while (isExist && tryCount < 3) {
      newPk = nanoid(21);
      isExist = await T3UserDevices.findOne({ where: { pk: newPk } });
      tryCount += 1;
    }

    return newPk;
  }

  static async getUserPkByAuthenticatedRequest(request) {
    if (!request.isAuthenticated) {
      return undefined;
    }

    const userDevices = await T3UserDevices.findOne({
      where: { sessionSalt: request.auth.credentials.sessionSalt },
    });

    if (!userDevices) {
      return undefined;
    }

    return userDevices.userFk;
  }

}

T3UserDevices.init({
  pk: {
    type: DataTypes.STRING(4000),
    primaryKey: true,
  },
  userFk: {
    type: DataTypes.STRING(4000),
    allowNull: false,
  },
  ipAddress: {
    type: DataTypes.STRING(4000),
  },
  userAgent: {
    type: DataTypes.STRING(4000),
  },
  latitude: {
    type: DataTypes.STRING(4000),
  },
  longitude: {
    type: DataTypes.STRING(4000),
  },
  country: {
    type: DataTypes.STRING(4000),
  },
  state: {
    type: DataTypes.STRING(4000),
  },
  city: {
    type: DataTypes.STRING(4000),
  },
  mapImageSrc: {
    type: DataTypes.STRING(4000),
  },
  deletedAt: {
    type: DataTypes.DATE,
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  sessionId: {
    type: DataTypes.STRING(4000),
  },
  sessionSalt: {
    type: DataTypes.STRING(4000),
  },
  sessionExpires: {
    type: DataTypes.DATE,
    defaultValue: null,
  },
  timezone: {
    type: DataTypes.STRING(4000),
  },
  verifyKey: {
    type: DataTypes.STRING(4000),
    defaultValue: null,
  },
}, {
  sequelize: sequelizeConn,
  modelName: 'T3UserDevices',
  freezeTableName: true,
  timestamps: true,
  alter: true,
});

T3UserDevices.beforeSave(async (model) => {
  // generate pk
  const newPk = await model.generatePk();
  model.pk = newPk;
});

export default T3UserDevices;
