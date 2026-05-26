const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');

// Importamos los middlewares de seguridad
const { verifyToken } = require('../middlewares/verifyToken');
const { verifyRole } = require('../middlewares/verifyRole');

// ==========================================
// Rutas de Administración
// ==========================================

// Endpoint para listar usuarios con 5 o más reportes dudosos
// Está protegido: Requiere token válido y que el rol sea 'admin'
router.get(
  '/users/flagged',
  verifyToken,
  verifyRole(['admin']),
  adminController.getFlaggedUsers
);

module.exports = router;