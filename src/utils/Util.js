/* eslint-disable no-param-reassign */
/* eslint-disable no-shadow */
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import escape from 'lodash.escape';
import nodemailer from 'nodemailer';
import fs from 'fs';
import { ENVIRONMENT } from './Constant.js';

class Util {

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
    } else {
      response = h.response({
        status,
        message: detailInfo.message,
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
