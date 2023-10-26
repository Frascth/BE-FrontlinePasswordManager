/* eslint-disable no-param-reassign */
/* eslint-disable no-shadow */
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import escape from 'lodash.escape';
import { ENVIRONMENT } from './Constant.js';

class Util {

  static response(h, status = false, message = 'Failed', code = 500, data = {}, detailInfo = 'Error from catch') {
    let response = h.response({
      status,
      message,
      data,
    });
    response.code(code);

    if (status) {
      detailInfo = message;
    }

    if (ENVIRONMENT === 'development') {
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
