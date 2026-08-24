const externalAuth = (req, res, next) => {
  const otpCode = req.headers['x-otp-code'];

  if (!otpCode) {
    return res.status(401).json({ error: 'Se requiere el código OTP en el header x-otp-code.' });
  }

  req.otpCode = otpCode;
  next();
};

module.exports = { externalAuth };
