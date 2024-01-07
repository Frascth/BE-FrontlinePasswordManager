/* eslint-disable eqeqeq */
/* eslint-disable max-len */
/* eslint-disable no-param-reassign */
/* eslint-disable no-shadow */
import crypto from 'crypto';
import { scheduleJob } from 'node-schedule';
import https from 'https';
import { promises as fs } from 'fs';
import { dirname } from 'path';
import moment from 'moment-timezone';
import fetch from 'node-fetch';
import useragent from 'useragent';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import escape from 'lodash.escape';
import nodemailer from 'nodemailer';
import waConn from '../waConnection.js';
import { ENVIRONMENT, CHARACTERS, SERVER, EMAIL, GLOBAL_SETTING, TP_API, API_KEY, HTTP_CODE, SAFE_STORAGE } from './constant.js';
import logger from '../logger.js';
import T1Country from '../models/T1Country.js';

class Util {

  static async resetApiLimit(key) {
    let scheduledDate;
    if (key === 'IPINFO_REACH_LIMIT') {
      // ipinfo limit is for 30 days
      scheduledDate = Util.surplusDate(Util.getDatetime(), 24 * 3600 * 30);
      scheduleJob(scheduledDate, () => {
        TP_API[key] = false;
      });
    } else if (key === 'GEOAPIFY_REACH_LIMIT') {
      // geoapify limit is for 24 hours
      scheduledDate = Util.surplusDate(Util.getDatetime(), 24 * 3600);
      scheduleJob(scheduledDate, () => {
        TP_API[key] = false;
      });
    }
    console.log(`resetApiLimit(${key}), scheduled to run at: ${scheduledDate}`);
    logger.info(`resetApiLimit(${key}), scheduled to run at: ${scheduledDate}`);
  }

  static async getUserDetail(request) {
    const ipAddress = Util.getUserIp(request);
    const {
      country,
      state,
      city,
      timezone,
      longitude,
      latitude,
    } = await Util.getUserLocation(ipAddress);

    return {
      ipAddress,
      country,
      state,
      city,
      longitude,
      latitude,
      timezone,
      userAgent: Util.getRawUserAgent(request),
      userAgentParsed: Util.getParsedUserAgent(request),
    };
  }

  static getUserIp(request) {
    let ip;
    if (request.headers['x-forwarded-for'] && request.headers['x-forwarded-for'].includes(',')) {
      [ip] = request.headers['x-forwarded-for'].replace('/ /g', '').split(',');
    }

    if (!ip) {
      ip = request.headers['x-real-ip'] || request.info.remoteAddress;
    }

    if (!ip) {
      ip = request.headers['x-forwarded-for'];
    }
    return ip;
  }

  /**
   * user pk is defined when server calling AuthController.validateCookie function
   * @param {*} request
   * @returns userPk
   */
  static getUserPkByAuthenticatedRequest(request) {
    // credentials.pk is defined when calling a validateCookie function
    if (!request.auth.isAuthenticated) {
      return undefined;
    }

    return request.auth.credentials.pk;

  }

  static getRawUserAgent(request) {
    const ua = request.headers['user-agent'] || 'none';
    return ua;
  }

  static getParsedUserAgent(request) {
    const agent = useragent.parse(request.headers['user-agent']);
    return {
      device: agent.device.toString(),
      os: agent.os.toString(),
      browser: agent.toAgent(),
    };
  }

  /**
   * async function
   * @param {string} ip
   * @returns location object see
   * https://apidocs.geoapify.com/playground/ip-geolocation/
   */
  static async getUserLocation(ip) {

    let userLocation;

    const geoapify = async (ip) => {
      let apiUrl = TP_API.GET_LOCATION_GEOAPIFY;
      apiUrl = apiUrl.replace(/{{ip}}/g, ip);
      apiUrl = apiUrl.replace(/{{apiKey}}/g, API_KEY.GEOAPIFY);
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (response.status === HTTP_CODE.TOO_MANY_REQUEST) {
        TP_API.GEOAPIFY_REACH_LIMIT = true;
        console.log('GEOAPIFY api reach limit daily usage');
        // call cron to schedule 24 hour in the future set reach limit to false
        Util.resetApiLimit('GEOAPIFY_REACH_LIMIT');
        return undefined;
      }

      if (response.status !== 200) {
        logger.error(data.message);
        console.log(data.message);
        return undefined;
      }

      const {
        continent: { name: continent },
        country: { name: country, capital },
        state: { name: state },
        city: { name: city },
        location: { longitude, latitude },
      } = data;

      const timezone = `${continent}/${capital}`;

      return { city, state, country, timezone, longitude, latitude };
    };

    const ipinfo = async (ip) => {
      let apiUrl = TP_API.GET_LOCATION_IPINFO;
      apiUrl = apiUrl.replace(/{{ip}}/g, ip);
      apiUrl = apiUrl.replace(/{{apiKey}}/g, API_KEY.IPINFO);
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (response.status === HTTP_CODE.TOO_MANY_REQUEST) {
        TP_API.IPINFO_REACH_LIMIT = true;
        console.log('IPINFO api reach limit monthly usage');
        // call cron to schedule 30 days in the future set reach limit to false
        Util.resetApiLimit('IPINFO_REACH_LIMIT');
        return undefined;
      }

      if (response.status !== 200) {
        logger.error(data.message);
        console.log(data.message);
        return undefined;
      }

      const { city, region: state, countryCode, timezone, loc } = data;
      const [latitude, longitude] = loc.split(',');
      const countryObject = await T1Country.findOne({ where: { code: countryCode, isDeleted: false } });
      const country = countryObject ? countryObject.name : countryCode;

      return { city, state, country, timezone, longitude, latitude };
    };

    if (TP_API.GEOAPIFY_REACH_LIMIT === false) {
      userLocation = await geoapify(ip);
    } else {
      userLocation = await ipinfo(ip);
    }
    return userLocation;
  }

  static getStaticMapImageUrl(longitude, latitude, width = 600, height = 400, zoom = 14) {
    let apiUrl = TP_API.GET_STATIC_MAP_IMAGE;
    apiUrl = apiUrl.replace(/{{width}}/g, width);
    apiUrl = apiUrl.replace(/{{height}}/g, height);
    apiUrl = apiUrl.replace(/{{zoom}}/g, zoom);
    apiUrl = apiUrl.replace(/{{longitude}}/g, longitude);
    apiUrl = apiUrl.replace(/{{latitude}}/g, latitude);
    apiUrl = apiUrl.replace(/{{apiKey}}/g, API_KEY.GEOAPIFY);
    return apiUrl;
  }

  /**
   *
   * @param {string} imageUrl
   * @param {string} format
   * @returns base64 string with prefix
   */
  static async getImageAsBase64(imageUrl, format = 'jpeg') {
    const response = await new Promise((resolve, reject) => {
      https.get(imageUrl, { responseType: 'arraybuffer' }, (res) => {
        resolve(res);
      }).on('error', (error) => {
        reject(error);
      });
    });

    if (response.statusCode === 200) {
      const data = [];
      await new Promise((resolve, reject) => {
        response.on('data', (chunk) => {
          data.push(chunk);
        });

        response.on('end', () => {
          resolve();
        });

        response.on('error', (error) => {
          reject(error);
        });
      });

      const imageBuffer = Buffer.concat(data);
      return `data:image/${format};base64,${imageBuffer.toString('base64')}`;
    }

    logger.error(`Failed to fetch the image. HTTP Status Code: ${response.statusCode}`);
    console.log(`Failed to fetch the image. HTTP Status Code: ${response.statusCode}`);
    throw new Error(`Failed to fetch the image. HTTP Status Code: ${response.statusCode}`);
  }

  static removeBase64Prefix(base64String) {
    if (base64String.includes('base64,')) {
      return base64String.split('base64,')[1];
    }

    return base64String;
  }

  static async writeBase64ToFile(base64String, filePath) {
    base64String = Util.removeBase64Prefix(base64String);
    try {
      // make folder if there is no that folder
      await fs.mkdir(dirname(filePath), { recursive: true });

      // Create a buffer from the Base64-encoded string
      const buffer = Buffer.from(base64String, 'base64');

      // Write the buffer to the file asynchronously
      await fs.writeFile(filePath, buffer);

      console.log('File written successfully:', filePath);
    } catch (error) {
      console.error('Error writing file:', error.message);
    }
  }

  static isCookiePresent(request) {
    if (!request.headers.cookie || !request.headers.cookie.includes(`${SERVER.COOKIE_NAME}=`)) {
      return false;
    }
    return true;
  }

  static getSessionSalt(request) {
    return request.state[SERVER.COOKIE_NAME].sessionSalt;
  }

  static generateRandomString(length = 40) {
    const charArray = Array.from({ length }, () => CHARACTERS[crypto.randomBytes(1).readUInt8() % CHARACTERS.length]);
    return charArray.join('');
  }

  static generateHexString(bytes = 16) {
    // bytes : character = 1 : 2
    // 16 bytes = 32 character
    return crypto.randomBytes(bytes).toString('hex');
  }

  static encryptPassword(plainText, salt, iv) {
    const key = crypto.pbkdf2Sync(SAFE_STORAGE.MASTER_PASSWORD, salt, 100000, 32, 'sha256');
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), Buffer.from(iv, 'hex'));
    let encrypted = cipher.update(plainText, 'utf-8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  static decryptPassword(encryptedData, salt, iv) {
    const key = crypto.pbkdf2Sync(SAFE_STORAGE.MASTER_PASSWORD, salt, 100000, 32, 'sha256');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(encryptedData, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');
    return decrypted;
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

  static getDatetime(timezone = GLOBAL_SETTING.TIMEZONE) {
    const momentTimezone = moment.tz(timezone);
    const jsTimezone = momentTimezone.toDate();
    return jsTimezone;
  }

  static async sendWhatsApp(to, message) {
    to = to.replace(/[^0-9]/g, '');
    to += '@c.us';
    const isRegistered = await waConn.isRegisteredUser(to);
    if (isRegistered) {
      waConn.sendMessage(to, message);
    }

  }

  /**
 *
 * @param {datetime} datetime
 * @param {int} surplusBy in second
 * @returns datetime
 */
  static surplusDate(datetime, surplusBy) {
    datetime = new Date(datetime);
    return new Date(datetime.getTime() + surplusBy * 1000);
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

  static async sendMail(to, subject, html, text = '', attachments = []) {
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
      attachments,
    };

    // Send the email
    try {
      const info = await transporter.sendMail(mailOptions);
      // If the email was sent successfully
      return { status: true, message: 'Success, email sent', info };
    } catch (error) {
      // If there was an error sending the email
      console.log('Send email error:', error);
      logger.error('Send email error:', error.message);
      return { status: false, message: error.message };
    }

  }

  static response(h, status = false, message = 'Failed', code = 500, data = {}) {
    let response = h.response({
      status,
      message: message.message || message,
      data,
    });

    if (ENVIRONMENT === 'development') {
      response = h.response({
        status,
        message,
        data,
      });

    }

    response.code(code);

    return response;
  }

  static async hashText(plainText, salt = undefined) {
    try {
      salt = salt || await bcrypt.genSalt(10);
      const hashedText = await bcrypt.hash(plainText, salt);
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

  /**
   *
   * @param {int} length
   * @returns url safe random string
   */
  static getRandomUrl(length = 30) {
    return nanoid(length);
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
