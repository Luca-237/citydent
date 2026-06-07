const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

const sendVerificationEmail = async (to, code) => {
  await transporter.sendMail({
    from: `"CityFixer" <${process.env.MAIL_FROM || process.env.MAIL_USER}>`,
    to,
    subject: 'Código de verificación — CityFixer',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Verificá tu identidad</h2>
        <p>Usá el siguiente código para completar tu perfil en CityFixer. Expira en <strong>10 minutos</strong>.</p>
        <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 24px 0;">
          ${code}
        </div>
        <p style="color: #888; font-size: 12px;">Si no solicitaste este código, ignorá este mensaje.</p>
      </div>
    `
  });
};

module.exports = { sendVerificationEmail };
