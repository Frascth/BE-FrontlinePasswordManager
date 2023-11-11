import { sequelizeConn } from '../dbConnection.js';
import T3SafeStorage from '../models/T3SafeStorage.js';
import Util from '../utils/Util.js';

/* eslint-disable prefer-const */
class SafeStorageController {

  static async create(request, h) {
    const { title, website, username, password } = request.payload;
    const transaction = await sequelizeConn.transaction();
    const userFk = Util.getUserPk(request);

    try {
      const encryptedPassword = Util.encryptText(password);
      await T3SafeStorage.create({
        userFk,
        title,
        website,
        username,
        password: encryptedPassword,
      }, { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      return Util.response(h, false, error, 500);
    }

    return Util.response(h, true, 'Success, data saved', 201);
  }

}

export default SafeStorageController;
