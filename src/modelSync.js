/* eslint-disable no-shadow */
import { sequelizeConn } from './dbConnection.js';
import T3User from './models/T3User.js';
import T3Otp from './models/T3Otp.js';

/**
 * callint a Model.init and add all model to sequelizeConn.models
 * its later use on sequelizeConn.sync() to create table
 */
async function defineAllModel() {
  // get all model
  const models = [
    T3User,
    T3Otp,
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
  // user has many otp
  const { T3User, T3Otp } = sequelizeConn.models;
  T3Otp.belongsTo(T3User, { foreignKey: 'userFk', as: 'user' });
  T3User.hasMany(T3Otp, { as: 'otps' });
}

async function syncModelWithDb() {
  await sequelizeConn.sync();
  console.log('Success sync with database');
}

export { defineAllModel, applyModelsAssociation, syncModelWithDb };
