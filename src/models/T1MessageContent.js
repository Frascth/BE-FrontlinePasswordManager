import { DataTypes, Model } from 'sequelize';
import { sequelizeConn } from '../dbConnection.js';

class T1MessageContent extends Model {}

T1MessageContent.init({
  pk: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(500),
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.STRING(4000),
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT('long'),
    allowNull: false,
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
  modelName: 'T1MessageContent',
  freezeTableName: true,
  timestamps: true,
});

export default T1MessageContent;
