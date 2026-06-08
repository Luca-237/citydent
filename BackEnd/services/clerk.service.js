const User = require('../models/user');
const Role = require('../models/role');

const upsertUser = async ({ clerkId, email, firstName, lastName, imageUrl, dni }) => {
  // Primero busca por clerkId (login normal)
  let existingUser = await User.findOne({ clerkId });

  // Si no encuentra, busca un usuario pre-creado por el admin con ese email
  if (!existingUser) {
    const preCreated = await User.findOne({ email, clerkId: null });
    if (preCreated) {
      return await User.findByIdAndUpdate(
        preCreated._id,
        {
          $set: {
            clerkId,
            ...(firstName && { firstName }),
            ...(lastName && { lastName }),
            ...(imageUrl && { imageUrl })
          }
        },
        { returnDocument: 'after' }
      ).populate('role');
    }
  }

  const updateFields = { clerkId, email, firstName, lastName, ...(imageUrl && { imageUrl }) };

  if (existingUser) {
    updateFields.role = existingUser.role;
  } else {
    const userRole = await Role.findOne({ name: 'user' });
    if (!userRole) {
      throw Object.assign(new Error('Rol por defecto no encontrado. Asegurate de haber corrido el seed.'), { status: 500 });
    }
    updateFields.role = userRole._id;
  }

  return await User.findOneAndUpdate(
    { clerkId },
    { $set: updateFields },
    { upsert: true, returnDocument: 'after' }
  ).populate('role');
};

module.exports = { upsertUser };