/* eslint-disable prefer-const */
import T3User from '../models/T3User.js';
import Util from '../utils/Util.js';

class UserController {

  static async createUser(request, h) {

    // get data from client
    let { username, email, password, twoFacAuth, waNumber } = request.payload;
    username = Util.escapeInput(username);
    email = Util.escapeInput(email);
    twoFacAuth = Util.escapeInput(twoFacAuth);

    // get salt and hash password
    const { hashedText } = await Util.hashText(password);

    // generate activation key
    const activationKey = Util.generateActivationKey(username);

    let newUser;

    try {
      newUser = await T3User.create({
        username,
        email,
        hashedPassword: hashedText,
        activationKey,
        twoFacAuth,
        waNumber,
        createdBy: 'self',
        updatedBy: 'self',
      });

    } catch (error) {
      let response = Util.response(h, false, error, 400);
      return response;
    }

    await newUser.getActivationLinkEmail();

    return Util.response(h, true, 'Success to create new user', 201);
  }

}

export default UserController;
