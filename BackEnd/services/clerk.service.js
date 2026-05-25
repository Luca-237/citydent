const User = require('../models/user');

const DNI_REGEX = /^\d{8}$/;

const upsertUser = async ({ clerkId, email, firstName, lastName, dni }) => {
  if (!dni) {
    throw Object.assign(new Error('El DNI es requerido'), { status: 400 });
  }

  if (!DNI_REGEX.test(String(dni))) {
    throw Object.assign(new Error('El DNI debe tener exactamente 8 dígitos numéricos'), { status: 400 });
  }

  const existingUser = await User.findOne({ email });
  const role = existingUser?.role ?? 'user';

  return await User.findOneAndUpdate(
    { email },
    { $set: { clerkId, email, firstName, lastName, role, dni } },
    { upsert: true, returnDocument: 'after' }
  );
};

module.exports = { upsertUser };
