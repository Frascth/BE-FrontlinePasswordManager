/* eslint-disable prefer-const */
import { DataTypes, Model } from 'sequelize';
import { sequelizeConn } from '../dbConnection.js';

class T3Otp extends Model {}

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
