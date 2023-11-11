/* eslint-disable prefer-const */
import { nanoid } from 'nanoid';
import { DataTypes, Model } from 'sequelize';
import { sequelizeConn } from '../dbConnection.js';

class T3SafeStorage extends Model {

  async generatePk() {
    let newPk = nanoid(21);
    let isExist = await T3SafeStorage.findOne({ where: { pk: newPk } });
    let tryCount = 0;

    while (isExist && tryCount < 3) {
      newPk = nanoid(21);
      isExist = await T3SafeStorage.findOne({ where: { pk: newPk } });
      tryCount += 1;
    }

    return newPk;
  }

}

T3SafeStorage.init({
  pk: {
    type: DataTypes.STRING(4000),
    primaryKey: true,
  },
  userFk: {
    type: DataTypes.STRING(4000),
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING(4000),
  },
  website: {
    type: DataTypes.STRING(4000),
  },
  username: {
    type: DataTypes.STRING(4000),
  },
  password: {
    type: DataTypes.STRING(4000),
  },
  deletedAt: {
    type: DataTypes.DATE,
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  sequelize: sequelizeConn,
  modelName: 'T3SafeStorage',
  freezeTableName: true,
  timestamps: true,
});

T3SafeStorage.beforeSave(async (t3SafeStorage) => {
  // generate pk
  const newPk = await t3SafeStorage.generatePk();
  t3SafeStorage.pk = newPk;
});

export default T3SafeStorage;
