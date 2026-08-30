const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { verifyRole } = require('../middlewares/verifyRole');
const { externalAuth } = require('../middlewares/externalAuth');
const { requestOtp, getData } = require('../controllers/external.controller');

/**
 * @openapi
 * /api/external/request-otp:
 *   post:
 *     summary: Solicitar OTP para consumo externo (admin/superAdmin)
 *     description: El admin o superAdmin genera un OTP (válido 24 h) para que Power BI consuma los datos.
 *     tags: [External]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OTP generado }
 *       403: { description: Sin permisos }
 */
// admin y superAdmin solicitan el OTP desde la app
router.post('/request-otp', authMiddleware, verifyRole('admin', 'superAdmin'), requestOtp);

/**
 * @openapi
 * /api/external/data/{table}:
 *   get:
 *     summary: Obtener una tabla de datos (Power BI)
 *     description: >
 *       Devuelve una tabla por request. Requiere un OTP válido en el header
 *       x-otp-code, validado por el middleware externalAuth.
 *     tags: [External]
 *     security: [{ otpAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: table
 *         required: true
 *         schema:
 *           type: string
 *           enum: [groups, incidents, statusHistory, statuses, categories, neighborhoods, users]
 *     responses:
 *       200: { description: Filas de la tabla solicitada }
 *       401: { description: OTP inválido o expirado }
 *       400: { description: Tabla no válida }
 */
// Power BI consume una tabla por request con OTP.
// Tablas válidas: groups | incidents | statusHistory | statuses | categories | neighborhoods | users
router.get('/data/:table', externalAuth, getData);

module.exports = router;
