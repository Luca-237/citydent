const crypto = require('crypto');
const ExternalOtp = require('../models/externalOtp');
const IncidentGroup = require('../models/incidentGroup');
const Incident = require('../models/incident');
const Status = require('../models/status');
const Category = require('../models/category');
const User = require('../models/user');
const Neighborhood = require('../models/neighborhood');
const { sendExternalOtpEmail } = require('./mail.service');

const OTP_TTL_HOURS = 24;

// ==========================================
// SOLICITUD DE OTP (superAdmin)
// ==========================================

/**
 * Genera un OTP (válido 24 h) para el consumo externo de datos y lo envía por
 * email al superAdmin. Invalida los OTP previos no usados del mismo usuario.
 *
 * @param {string} userId    ObjectId del superAdmin solicitante.
 * @param {string} userEmail Email donde enviar el código.
 * @returns {Promise<void>}
 */
const requestExternalOtp = async (userId, userEmail) => {
  await ExternalOtp.deleteMany({ userId, used: false });

  const code = String(crypto.randomInt(100000, 999999));
  const expiresAt = new Date(Date.now() + OTP_TTL_HOURS * 60 * 60 * 1000);

  await ExternalOtp.create({ userId, code, expiresAt });
  await sendExternalOtpEmail(userEmail, code);
};

// ==========================================
// VALIDACIÓN DE OTP (Power BI)
// ==========================================

/**
 * Valida un OTP de consumo externo (debe existir, no estar usado y no haber expirado).
 *
 * @param {string} code Código OTP recibido.
 * @returns {Promise<void>}
 * @throws {Error} 401 si el código es inválido o expiró.
 */
const validateExternalOtp = async (code) => {
  const otp = await ExternalOtp.findOne({ code, used: false });

  if (!otp || otp.expiresAt < new Date()) {
    const error = new Error('Código inválido o expirado.');
    error.status = 401;
    throw error;
  }
};

// ==========================================
// BUILDERS — uno por tabla (una request por tabla)
// ==========================================

// Builders de tablas para Power BI: cada uno aplana un modelo a filas planas.

/**
 * Tabla de grupos de incidentes aplanada (incluye coordenadas del representante).
 * Expone los ids de estado, categoría, barrio y representante para poder armar
 * las relaciones del modelo sin unir por texto.
 *
 * @returns {Promise<Array<Object>>} Filas de grupos.
 */
const getGroups = async () => {
  const groups = await IncidentGroup.find()
    .populate('status', 'name')
    .populate('category', 'name')
    .populate('neighborhood', 'name')
    .populate('representativeId', 'location');

  return groups.map(g => ({
    id: g._id,
    statusId: g.status?._id || null,
    status: g.status?.name || null,
    categoryId: g.category?._id || null,
    category: g.category?.name || null,
    neighborhoodId: g.neighborhood?._id || null,
    neighborhood: g.neighborhood?.name || null,
    representativeId: g.representativeId?._id || null,
    priority: g.priority,
    incidentCount: g.incidents.length,
    isEmergency: g.is_emergency,
    isArchived: g.isArchived,
    lat: g.representativeId?.location?.lat || null,
    lng: g.representativeId?.location?.lng || null,
    finalizedAt: g.finalizedAt,
    createdAt: g.createdAt
  }));
};

/**
 * Tabla de incidentes individuales aplanada (con datos del usuario reportante).
 * `userId` es la clave real contra la tabla `users`: los campos de nombre, email
 * y DNI quedan solo como atributos descriptivos.
 *
 * @returns {Promise<Array<Object>>} Filas de incidentes.
 */
const getIncidents = async () => {
  const incidents = await Incident.find()
    .populate('status', 'name')
    .populate('category', 'name')
    .populate('user', 'firstName lastName email dni');

  return incidents.map(i => ({
    id: i._id,
    groupId: i.group,
    title: i.title,
    description: i.description,
    statusId: i.status?._id || null,
    status: i.status?.name || null,
    categoryId: i.category?._id || null,
    category: i.category?.name || null,
    aiSuggestedCategory: i.ai_suggested_category,
    isDubious: i.is_dubious,
    isCancelled: i.is_cancelled,
    isEmergency: i.is_emergency,
    lat: i.location?.lat || null,
    lng: i.location?.lng || null,
    userId: i.user?._id || null,
    userName: i.user ? `${i.user.firstName} ${i.user.lastName}`.trim() : null,
    userEmail: i.user?.email || null,
    userDni: i.user?.dni || null,
    createdAt: i.createdAt
  }));
};

/**
 * Tabla de estados aplanada.
 * @returns {Promise<Array<Object>>} Filas de estados.
 */
const getStatuses = async () => {
  const statuses = await Status.find().sort({ name: 1 });
  return statuses.map(s => ({
    id: s._id,
    name: s.name,
    description: s.description
  }));
};

/**
 * Tabla de categorías aplanada.
 * @returns {Promise<Array<Object>>} Filas de categorías.
 */
const getCategories = async () => {
  const categories = await Category.find().sort({ name: 1 });
  return categories.map(c => ({
    id: c._id,
    name: c.name,
    description: c.description
  }));
};

/**
 * Tabla de usuarios aplanada. Incluye el usuario de sistema de la IA (rol `ai`)
 * para que `statusHistory.changedById` resuelva contra esta tabla: quien consuma
 * los datos lo filtra por rol si necesita excluirlo.
 *
 * @returns {Promise<Array<Object>>} Filas de usuarios.
 */
const getUsers = async () => {
  const users = await User.find()
    .populate('role', 'name')
    .populate('barrio', 'name');

  return users.map(u => ({
    id: u._id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    dni: u.dni,
    telefono: u.telefono,
    role: u.role?.name || null,
    ciudad: u.ciudad,
    barrio: u.barrio?.name || null,
    provincia: u.provincia,
    profileComplete: u.profileComplete,
    isBanned: u.isBanned,
    createdAt: u.createdAt
  }));
};

/**
 * Historial de cambios de estado de los grupos, una fila por transición.
 * Es la tabla de hechos que permite medir los tiempos por etapa (primera
 * respuesta, gestión, resolución), que no se pueden calcular solo con
 * `createdAt` y `finalizedAt`.
 *
 * `changedById` apunta al usuario que hizo el cambio y resuelve siempre contra
 * la tabla `users`, incluido el usuario de sistema de la IA en las transiciones
 * con `source: 'ai'`. Queda en null solo en las de `source: 'system'`.
 *
 * @returns {Promise<Array<Object>>} Filas del historial, ordenadas por grupo y fecha.
 */
const getStatusHistory = async () => {
  const groups = await IncidentGroup.find()
    .select('statusHistory')
    .populate('statusHistory.status', 'name');

  const rows = [];

  for (const group of groups) {
    const historial = [...group.statusHistory]
      .sort((a, b) => new Date(a.changedAt) - new Date(b.changedAt));

    historial.forEach((h, idx) => {
      rows.push({
        id: h._id,
        groupId: group._id,
        statusId: h.status?._id || null,
        status: h.status?.name || null,
        changedAt: h.changedAt,
        changedById: h.changedBy || null,
        source: h.source,
        orden: idx + 1
      });
    });
  }

  return rows;
};

/**
 * Centroide aproximado de un polígono: promedio de los vértices del anillo
 * exterior. Alcanza para ubicar una burbuja por barrio en un mapa.
 *
 * @param {Object} geometry Geometría GeoJSON (Polygon o MultiPolygon).
 * @returns {{lat:number, lng:number}|null}
 */
const centroideDe = (geometry) => {
  if (!geometry?.coordinates?.length) return null;

  const anillo = geometry.type === 'MultiPolygon'
    ? geometry.coordinates[0]?.[0]
    : geometry.coordinates[0];

  if (!Array.isArray(anillo) || anillo.length < 3) return null;

  // El primer vértice suele repetirse al final para cerrar el anillo.
  const primero = anillo[0];
  const ultimo = anillo[anillo.length - 1];
  const cerrado = primero[0] === ultimo[0] && primero[1] === ultimo[1];
  const vertices = cerrado ? anillo.slice(0, -1) : anillo;

  if (!vertices.length) return null;

  const suma = vertices.reduce((acc, [lng, lat]) => ({ lng: acc.lng + lng, lat: acc.lat + lat }), { lng: 0, lat: 0 });

  return {
    lng: suma.lng / vertices.length,
    lat: suma.lat / vertices.length
  };
};

/**
 * Tabla de barrios aplanada, con el centroide de cada polígono.
 * No expone la geometría completa: Power BI necesita TopoJSON para mapas de
 * formas y el centroide alcanza para un mapa de burbujas.
 *
 * @returns {Promise<Array<Object>>} Filas de barrios.
 */
const getNeighborhoods = async () => {
  const barrios = await Neighborhood.find().sort({ name: 1 });

  return barrios.map(b => {
    const centroide = centroideDe(b.geometry);
    return {
      id: b._id,
      name: b.name,
      centroidLat: centroide?.lat ?? null,
      centroidLng: centroide?.lng ?? null
    };
  });
};

// ==========================================
// DISPATCHER — lista blanca de tablas
// ==========================================

// Para sumar una tabla nueva: agregás su builder arriba y una línea acá.
const TABLES = {
  groups: getGroups,
  incidents: getIncidents,
  statusHistory: getStatusHistory,
  statuses: getStatuses,
  categories: getCategories,
  neighborhoods: getNeighborhoods,
  users: getUsers
};

const AVAILABLE_TABLES = Object.keys(TABLES);

/**
 * Devuelve una tabla de datos para consumo externo, validando contra la lista
 * blanca de tablas (`AVAILABLE_TABLES`).
 *
 * @param {('groups'|'incidents'|'statusHistory'|'statuses'|'categories'|'neighborhoods'|'users')} table Nombre de la tabla.
 * @returns {Promise<Array<Object>>} Filas de la tabla solicitada.
 * @throws {Error} 400 si la tabla no es válida.
 */
const getExternalTable = async (table) => {
  const builder = TABLES[table];
  if (!builder) {
    const error = new Error(`Tabla inválida. Tablas disponibles: ${AVAILABLE_TABLES.join(', ')}.`);
    error.status = 400;
    throw error;
  }
  return await builder();
};

module.exports = { requestExternalOtp, validateExternalOtp, getExternalTable, AVAILABLE_TABLES };
