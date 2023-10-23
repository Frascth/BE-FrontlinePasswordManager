/* eslint-disable no-console */
import { DataTypes } from 'sequelize';
import { nanoid } from 'nanoid';

function generateUserPk() {
  return nanoid(20);
}

function defineT3User(sequelizeConn) {
  const t3User = sequelizeConn.define('t3User', {
    pk: {
      type: DataTypes.STRING(4000),
      primaryKey: true,
      autoincrement: false,
    },
    username: {
      type: DataTypes.STRING(500),
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING(500),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    hashedPassword: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    salt: {
      type: DataTypes.STRING(7),
      allowNull: false,
    },
    activationKey: {
      type: DataTypes.STRING(4000),
      allowNull: false,
    },
    lastLoginTime: {
      type: DataTypes.DATE,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: sequelizeConn.literal('CURRENT_TIMESTAMP'),
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: sequelizeConn.literal('CURRENT_TIMESTAMP'),
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
      allowNull: false,
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  }, {
    freezeTableName: true,
    timestamps: false,
  });

  return t3User;
}

export default defineT3User;
