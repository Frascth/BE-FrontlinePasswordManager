/* eslint-disable no-console */
import { DataTypes } from 'sequelize';

function defineT3Tests(sequelizeConn) {
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

  return t3Meow;
}

export default defineT3Tests;
