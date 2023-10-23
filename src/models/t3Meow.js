/* eslint-disable no-console */
import { DataTypes } from 'sequelize';
import { sequelizeConn } from '../dbConnection.js';

const t3Meow = sequelizeConn.define('t3Meow', {
  pk: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoincrement: true,
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
}, {
  freezeTableName: true,
  timestamps: false,
});

export default t3Meow;
