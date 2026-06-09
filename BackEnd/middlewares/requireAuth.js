const User = require('../models/user');

// Lookup liviano — solo verifica que el usuario exista, sin chequear rol.
// Usar en rutas de onboarding donde el perfil aún no está completo.
const requireAuth = async (req, res, next) => {
  try {
    const clerkId = req.auth?.sub;
    if (!clerkId) return res.status(401).json({ error: 'No autorizado.' });

    const dbUser = await User.findOne({ clerkId });
    if (!dbUser) return res.status(404).json({ error: 'Usuario no encontrado.' });
    if (dbUser.isBanned) return res.status(403).json({ error: 'Tu cuenta ha sido suspendida.' });

    req.dbUser = dbUser;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

module.exports = requireAuth;
