import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { SERVER } from './utils/constant.js';

const transport = new DailyRotateFile({
  filename: `${SERVER.LOG_PATH}/%DATE%.log`,
  datePattern: 'DD-MM-YYYY',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '7d', // Keep logs for the last 7 days
});

// Define the logger configuration
const logger = winston.createLogger({
  level: 'info', // Log only messages with level 'info' and above
  format: winston.format.combine(
    winston.format.timestamp(), // Add a timestamp to each log entry
    winston.format.json(), // Log entries in JSON format
  ),
  transports: [
    transport,
    // new winston.transports.File({ filename: `${SERVER.LOG_PATH}/logfile.json` }),
  ],
});

export default logger;
// // Log a message
// logger.log({
//   level: 'info',
//   message: 'This is an informational message.',
// });

// // Log an error
// logger.error('This is an error message.');

// // Log a warning
// logger.warn('This is a warning message.');
