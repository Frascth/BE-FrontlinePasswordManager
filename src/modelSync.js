/* eslint-disable no-shadow */
import { sequelizeConn } from './dbConnection.js';
import T3User from './models/T3User.js';
import T3Otp from './models/T3Otp.js';
import T3SafeStorage from './models/T3SafeStorage.js';
import T1HtmlContent from './models/T1HtmlContent.js';
import T1MessageContent from './models/T1MessageContent.js';
import logger from './logger.js';
import T3UserDevices from './models/T3UserDevices.js';
import T1Country from './models/T1Country.js';

/**
 * callint a Model.init and add all model to sequelizeConn.models
 * its later use on sequelizeConn.sync() to create table
 */
function defineAllModel() {
  // get all model
  const models = [
    T1HtmlContent,
    T1MessageContent,
    T3User,
    T3Otp,
    T3SafeStorage,
    T3UserDevices,
    T1Country,
  ];

  // define all model to sequelizeConn.models
  models.forEach((Model) => {
    // eslint-disable-next-line no-new
    new Model(sequelizeConn);
  });
}

/**
 * apply all association that have configured on each model
 *
 * need to add assoc config manualy in this function when there is a new table or a new assoc
 */
function applyModelsAssociation() {

  // user has many otp in T3Otp
  const { T3User, T3Otp } = sequelizeConn.models;
  T3User.hasMany(T3Otp, { foreignKey: 'userFk', as: 'otps' });
  T3Otp.belongsTo(T3User, { foreignKey: 'userFk', as: 'user' });

  // user has many data in T3SafeStorage
  const { T3SafeStorage } = sequelizeConn.models;
  T3User.hasMany(T3SafeStorage, { foreignKey: 'userFk', as: 'datas' });
  T3SafeStorage.belongsTo(T3User, { foreignKey: 'userFk', as: 'user' });

  // user has many device in T3UserDevices
  const { T3UserDevices } = sequelizeConn.models;
  T3User.hasMany(T3UserDevices, { foreignKey: 'userFk', as: 'devices' });
  T3UserDevices.belongsTo(T3User, { foreignKey: 'userFk', as: 'user' });

}

async function syncModelWithDb() {
  await sequelizeConn.sync();
  console.log('Success sync with database');
  logger.info('Success sync with database');
}

export { defineAllModel, applyModelsAssociation, syncModelWithDb };
