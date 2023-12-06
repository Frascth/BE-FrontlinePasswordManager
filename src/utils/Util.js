/* eslint-disable max-len */
/* eslint-disable no-param-reassign */
/* eslint-disable no-shadow */
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import escape from 'lodash.escape';
import nodemailer from 'nodemailer';
import fs from 'fs';
import waConn from '../waConnection.js';
import { ENVIRONMENT, CHARACTERS, SERVER, EMAIL } from './constant.js';

class Util {

  static getUserPk(request) {
    const { pk } = request.auth.credentials;
    return pk;
  }

  static isCookiePresent(request) {
    if (!request.headers.cookie || !request.headers.cookie.includes(`${SERVER.COOKIE_NAME}=`)) {
      return false;
    }
    return true;
  }

  static generateRandomString(length = 40) {
    const charArray = Array.from({ length }, () => CHARACTERS[crypto.randomBytes(1).readUInt8() % CHARACTERS.length]);
    return charArray.join('');
  }

  static isEmail(inputString) {
    // Regular expression pattern for a simple email validation
    const emailPattern = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    // Test the email against the pattern and return true if it's a valid email
    return emailPattern.test(inputString);
  }

  /**
   * generate cryptographically secure random number
   * @param {Number} length default is 6 digits
   * @returns string of random number
   */
  static generateRandomNumber(length = 6) {
    const randomNumber = [];
    for (let i = 0; i < length; i += 1) {
      randomNumber.push(crypto.randomInt(0, 10));
    }
    return randomNumber.join('');
  }

  static async sendWhatsApp(to, message) {
    to = to.replace(/[^0-9]/g, '');
    to += '@c.us';
    const isRegistered = await waConn.isRegisteredUser(to);
    if (isRegistered) {
      await waConn.sendMessage(to, message);
    }

  }

  static getUTCDateNow() {
    return new Date(new Date().toISOString());
  }

  static pgTzToUTCDatetime(pgTz = '2000-12-31T23:59:59.999Z') {
    return new Date(pgTz);
  }

  static isTimeEqualorAboveInterval(datetime1, datetime2, interval, format = 'minutes') {
    datetime1 = new Date(datetime1);
    datetime2 = new Date(datetime2);
    const timeDifferenceInSeconds = Math.abs(Math.floor((datetime1 - datetime2) / 1000));
    let differenceInFormat;

    switch (format) {
      case 'second':
      case 'seconds':
        differenceInFormat = timeDifferenceInSeconds;
        break;
      case 'minute':
      case 'minutes':
        differenceInFormat = Math.abs(Math.floor(timeDifferenceInSeconds / 60));
        break;
      case 'hour':
      case 'hours':
        differenceInFormat = Math.abs(Math.floor(timeDifferenceInSeconds / 3600));
        break;
      case 'day':
      case 'days':
        differenceInFormat = Math.abs(Math.floor(timeDifferenceInSeconds / 86400));
        break;
      default:
        throw new Error('Invalid time unit. Use "second", "minute", "hour", or "day".');
    }
    return (differenceInFormat >= interval);
  }

  static getInterval(datetime1, datetime2, format = 'minutes') {
    datetime1 = new Date(datetime1);
    datetime2 = new Date(datetime2);
    const timeDifferenceInSeconds = Math.abs(Math.floor((datetime1 - datetime2) / 1000));
    let differenceInFormat;

    switch (format) {
      case 'second':
      case 'seconds':
        differenceInFormat = timeDifferenceInSeconds;
        break;
      case 'minute':
      case 'minutes':
        differenceInFormat = Math.abs(Math.floor(timeDifferenceInSeconds / 60));
        break;
      case 'hour':
      case 'hours':
        differenceInFormat = Math.abs(Math.floor(timeDifferenceInSeconds / 3600));
        break;
      case 'day':
      case 'days':
        differenceInFormat = Math.abs(Math.floor(timeDifferenceInSeconds / 86400));
        break;
      default:
        throw new Error('Invalid time unit. Use "second", "minute", "hour", or "day".');
    }
    return differenceInFormat;

  }

  static readDir() {
    fs.readdir('.', (err, files) => {
      if (err) {
        console.error('Error reading directory:', err);
        return;
      }

      console.log('Contents of the current directory:');
      files.forEach((file) => {
        console.log(file);
      });
    });
  }

  static async sendMail(to, subject, html, text = '') {
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      host: EMAIL.HOST,
      port: EMAIL.PORT,
      secure: true,
      auth: {
        user: EMAIL.USER,
        pass: EMAIL.PASSWORD,
      },
      // need to disable antivirus example avast to comment this
      tls: { rejectUnauthorized: false },
    });

    // Create an email message
    const mailOptions = {
      from: EMAIL.NAME,
      to,
      subject,
      text,
      html,
      attachment: [],
    };

    // Send the email
    try {
      const info = await transporter.sendMail(mailOptions);
      // If the email was sent successfully
      return { status: true, message: 'Success, email sent', info };
    } catch (error) {
      // If there was an error sending the email
      return { status: false, message: error.message };
    }

  }

  static response(h, status = false, message = 'Failed', code = 500, data = {}) {
    let response = h.response({
      status,
      message: message.message || message,
      data,
    });
    response.code(code);

    if (ENVIRONMENT === 'development') {
      response = h.response({
        status,
        message,
        data,
      });
      response.code(code);

    }

    return response;
  }

  static async hashText(plainPassword) {
    try {
      const salt = await bcrypt.genSalt(10);
      const hashedText = await bcrypt.hash(plainPassword, salt);
      return { salt, hashedText };
    } catch (err) {
      // Handle any errors
      console.error(err);
      throw err; // Optionally re-throw the error
    }
  }

  static encryptText(plainText) {
    const encryptionKey = Buffer.from(SERVER.ENCRYPTION_KEY_HEX, 'hex');
    const initializationVector = Buffer.from(SERVER.INITIAL_VECTOR_HEX, 'hex');
    const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, initializationVector);

    let encryptedText = cipher.update(plainText, 'utf8', 'hex');
    encryptedText += cipher.final('hex');

    return encryptedText;

  }

  static decryptText(encryptedText) {
    const encryptionKey = Buffer.from(SERVER.ENCRYPTION_KEY_HEX, 'hex');
    const initializationVector = Buffer.from(SERVER.INITIAL_VECTOR_HEX, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', encryptionKey, initializationVector);

    let decryptedText = decipher.update(encryptedText, 'hex', 'utf8');
    decryptedText += decipher.final('utf8');

    return decryptedText;
  }

  static async compareHash(plain, hashedText) {
    const result = await bcrypt.compare(plain, hashedText);
    return result;
  }

  static generateActivationKey(username) {
    return username + nanoid(30);
  }

  static escapeInput(inputString) {
    return escape(inputString);
  }

  /**
 * whitespace only considered as empty string
 * @param {string} str
 * @returns boolean
 */
  static isEmptyString(str) {
    if (str === undefined || str.length === 0 || str.trim() === '') {
      return true;
    }
    return false;
  }

  /**
 * get the minPage and maxPage attribute for pagination
 * @param {int} totalData
 * @param {int} limit
 * @returns minPage and maxPage
 */
  static minMaxPagination(totalData, limit) {
    return {
      minPage: 1,
      maxPage: Math.ceil(totalData / limit),
    };
  }

  static getSort(str) {
    str = str.toLowerCase();
    str = str.trim();

    if (str === 'asc') {
      return 'asc';
    }

    if (str === 'desc') {
      return 'desc';
    }

    throw new Error('Sort text must be asc or desc');
  }

}

export default Util;
