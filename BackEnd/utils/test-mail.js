const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../config/.env') });

const nodemailer = require('nodemailer');

const testMail = async () => {
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    }
  });

  try {
    await transporter.verify();
    console.log('✔ Conexión SMTP verificada');

    const info = await transporter.sendMail({
      from: `"CityFixer Test" <${process.env.MAIL_FROM || process.env.MAIL_USER}>`,
      to: process.env.MAIL_USER,
      subject: 'Test de envío — CityFixer',
      html: '<p>Si ves este correo, el servicio de mail está funcionando correctamente. <strong>Código de prueba: 123456</strong></p>'
    });

    console.log(`✔ Mail enviado a: ${info.accepted.join(', ')}`);
    console.log(`  Message ID: ${info.messageId}`);
  } catch (error) {
    console.error('✖ Error:', error.message);
  }
};

testMail();
