// import { Client, LocalAuth } from 'whatsapp-web.js';
import qr from 'qrcode-terminal';
import Whatsapp from 'whatsapp-web.js';

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

waConn.on('ready', () => {
  console.log('WhatsApp connection is ready!');
});

export default waConn;
