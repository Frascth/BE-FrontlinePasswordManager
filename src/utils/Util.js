/* eslint-disable no-param-reassign */
/* eslint-disable no-shadow */
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import escape from 'lodash.escape';
import nodemailer from 'nodemailer';
import fs from 'fs';
import waConn from '../waConnection.js';
import { ENVIRONMENT } from './constant.js';

class Util {

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

  static isDateAboveInterval(date1, date2, interval, format = 'minutes') {
    date1 = new Date(date1);
    date2 = new Date(date2);
    const timeDifferenceInMilliseconds = date1 - date2;
    let differenceInFormat;

    switch (format) {
      case 'minute':
      case 'minutes':
        differenceInFormat = Math.abs(Math.floor(timeDifferenceInMilliseconds / 60000));
        break;
      case 'hour':
      case 'hours':
        differenceInFormat = Math.abs(Math.floor(timeDifferenceInMilliseconds / 3600000));
        break;
      case 'day':
      case 'days':
        differenceInFormat = Math.abs(Math.floor(timeDifferenceInMilliseconds / 86400000));
        break;
      default:
        throw new Error('Invalid time unit. Use "minutes", "hour", or "day".');
    }

    return (differenceInFormat > interval);

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

  static sendMail(to, subject, html, text = '') {
    // Create a Nodemailer transporter with your SMTP server details
    const transporter = nodemailer.createTransport({
      service: 'Gmail', // Use the appropriate email service
      host: 'smptp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'frontline.mailer@gmail.com', // Your email address
        pass: 'ibcquoqfewppfsjx', // Your email password or an app-specific password
      },
      // need to disable antivirus example avast to comment this
      tls: { rejectUnauthorized: false },
    });

    // Create an email message
    const mailOptions = {
      from: 'frontline.mailer@gmail.com',
      to,
      subject,
      text,
      html,
      attachment: [],
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Error:', error);
      } else {
        console.log('Email sent:', info.response);
      }
    });

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
    return username + nanoid(30);
  }

  static escapeInput(inputString) {
    return escape(inputString);
  }

}

export default Util;
