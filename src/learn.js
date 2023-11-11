// import Util from './utils/Util.js';
// import crypto from 'crypto';

// const encryptedText = Util.encryptText('k@FW@TAl,axtjnP:Bd1R#7hju.hFov(Z');
// console.log(encryptedText);
// const decryptedText = Util.decryptText(encryptedText);
// console.log(decryptedText);

// console.log(crypto.randomBytes(16).toString('hex'));

// console.log(Util.generateRandomString(32));

// function f1() {
//   return new Promise((resolve, reject) => {
//     // Simulate an async operation with a 2-second delay
//     setTimeout(() => {
//       resolve('F1 Operation completed successfully');
//       // or to mimic an error:
//       // reject('Something went wrong');
//     }, 1000); // 2000 milliseconds (2 seconds)
//   });
// }

// function f2() {
//   return new Promise((resolve, reject) => {
//     // Simulate an async operation with a 2-second delay
//     setTimeout(() => {
//       resolve('F2 Operation completed successfully');
//       // or to mimic an error:
//       // reject('Something went wrong');
//     }, 2000); // 2000 milliseconds (2 seconds)
//   });
// }

// function f3() {
//   return new Promise((resolve, reject) => {
//     // Simulate an async operation with a 2-second delay
//     setTimeout(() => {
//       resolve('F3 Operation completed successfully');
//       // or to mimic an error:
//       // reject('Something went wrong');
//     }, 3000); // 2000 milliseconds (2 seconds)
//   });
// }

// async function init() {
//   console.log(await f1());
//   console.log(await f2());
//   console.log(await f3());
// }

// await init();
// init();
// console.log('done');
