// import { Client, LocalAuth } from 'whatsapp-web.js';
import qr from 'qrcode-terminal';
import Whatsapp from 'whatsapp-web.js';
import { ADMIN_WA_NO } from './utils/constant.js';

const { Client, LocalAuth } = Whatsapp;

// waConn is alias for client in the official documentation
const waConn = new Client({
  authStrategy: new LocalAuth(),
});

waConn.on('qr', (qrText) => {
  // Generate and scan this code with your phone
  // console.log('QR RECEIVED', qrText);
  qr.generate(qrText, { small: true });
});

waConn.on('ready', async () => {
  let to = ADMIN_WA_NO;
  to = to.replace(/[^0-9]/g, '');
  to += '@c.us';
  const isRegistered = await waConn.isRegisteredUser(to);
  if (!isRegistered) {
    console.log('WhatsApp number is not registered');
    console.log('WhatsApp connection is ready!');
  }
  await waConn.sendMessage(to, 'WhatsApp connection for Frontline is ready!');
});

export default waConn;
