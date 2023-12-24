import { DataTypes, Model } from 'sequelize';
import { sequelizeConn } from '../dbConnection.js';

class T1Country extends Model {}

T1Country.init({
  pk: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  code: {
    type: DataTypes.STRING(500),
    allowNull: false,
    unique: true,
  },
  name: {
    type: DataTypes.STRING(4000),
    allowNull: false,
  },
  deletedAt: {
    type: DataTypes.DATE,
  },
  createdBy: {
    type: DataTypes.STRING(4000),
    defaultValue: 'INITIAL',
  },
  updatedBy: {
    type: DataTypes.STRING(4000),
    defaultValue: 'INITIAL',
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
  modelName: 'T1Country',
  freezeTableName: true,
  timestamps: true,
  alter: true,
});

export default T1Country;
