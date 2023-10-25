/* eslint-disable prefer-const */
/* eslint-disable no-console */
/* eslint-disable padded-blocks */
/* eslint-disable class-methods-use-this */
import T3User from '../models/T3User.js';
import Util from '../utils/Util.js';

class UserController {

  static async createUser(request, h) {

    // get data from client
    let { username, email, password, twoFacAuth } = request.payload;
    username = Util.escapeInput(username);
    email = Util.escapeInput(email);
    twoFacAuth = Util.escapeInput(twoFacAuth);

    // get salt and hash password
    const { salt, hashedPassword } = await Util.hashPassword(password);

    // generate activation key
    const activationKey = Util.generateActivationKey(username);

    let data = {
      pk: undefined,
      activationKey: undefined,
    };

    try {
      const newUser = await T3User.create({
        username,
        email,
        hashedPassword,
        salt,
        activationKey,
        twoFacAuth,
        createdBy: 'self',
        updatedBy: 'self',
      });

      data.pk = newUser.pk;
      data.activationKey = newUser.activationKey;
    } catch (error) {
      let response = Util.response(h, false, 'Failed, create new user', 400, data, error);
      return response;
    }
    return Util.response(h, true, 'Success to create new user', 201, data);
  }

  static async deleteUser() {
    return 'hello';
  }

}

export default UserController;
