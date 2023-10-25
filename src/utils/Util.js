/* eslint-disable no-param-reassign */
/* eslint-disable no-shadow */
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import escape from 'lodash.escape';

class Util {

  static response(h, status = false, message = 'failed', code = 500, data = {}, detailInfo = 'error from catch') {
    let response = h.response({
      status,
      message,
      data,
    });
    response.code(code);

    if (status === true) {
      detailInfo = message;
    }

    if (process.env.ENVIRONMENT === 'development') {
      response = h.response({
        status,
        message: detailInfo,
        data,
      });
    }

    return response;
  }

  static async hashPassword(plainPassword) {
    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(plainPassword, salt);
      return { salt, hashedPassword };
    } catch (err) {
      // Handle any errors
      console.error(err);
      throw err; // Optionally re-throw the error
    }
  }

  static generateActivationKey(username) {
    return username + nanoid(10);
  }

  static escapeInput(inputString) {
    return escape(inputString);
  }

}

export default Util;
