const Incident = require('../models/incident');
const Status = require('../models/status');
const mongoose = require('mongoose');

// ==========================================
// 1. VALIDACIONES
// ==========================================

const validateIncidentData = (data) => {
  const errors = [];

  // Título
  if (!data.title || typeof data.title !== 'string') {
    errors.push('El título es obligatorio y debe ser un texto.');
  } else if (data.title.trim().length === 0) {
    errors.push('El título no puede estar vacío o contener solo espacios.');
  } else if (data.title.trim().length > 100) {
    errors.push('El título no puede exceder los 100 caracteres.');
  }

  // Descripción
  if (!data.description || typeof data.description !== 'string') {
    errors.push('La descripción es obligatoria y debe ser un texto.');
  } else if (data.description.trim().length === 0) {
    errors.push('La descripción no puede estar vacía o contener solo espacios.');
  } else if (data.description.trim().length > 1000) {
    errors.push('La descripción no puede exceder los 1000 caracteres.');
  }

  // Categoría
  if (!data.category) {
    errors.push('La categoría es obligatoria.');
  } else if (!mongoose.Types.ObjectId.isValid(data.category)) {
    errors.push('La categoría enviada no es válida.');
  }

  // Fotos
  if (!Array.isArray(data.photos) || data.photos.length < 1 || data.photos.length > 3) {
    errors.push('Se requiere entre 1 y 3 fotos.');
  }

  // Ubicación
  if (!data.location?.lat || !data.location?.lng) {
    errors.push('La ubicación es obligatoria.');
  }

  return { isValid: errors.length === 0, errors };
};

// ==========================================
// 2. CREACIÓN (Usuario)
// ==========================================

const createIncident = async (incidentData, userId, finalStatusId, aiData) => {
  // Primero validar
  const validation = validateIncidentData(incidentData);
  if (!validation.isValid) {
    const error = new Error('Error en los datos del formulario');
    error.status = 400;
    error.details = validation.errors;
    throw error;
  }

  // Creación mapeando los datos de la IA recibidos del middleware
  const newIncident = new Incident({
    title: incidentData.title.trim(),
    description: incidentData.description.trim(),
    status: finalStatusId,
    category: incidentData.category,
    location: incidentData.location,
    photos: incidentData.photos,
    user: userId,
    // Insertamos la data de la IA (Prioridad y Justificación)
    priority: aiData?.prioridad || 1,
    ai_justification: aiData?.justificacion || 'No justificado',
    ai_suggested_category: aiData?.categoriaSugerida || 'No sugerida'
  });

  return await newIncident.save();
};

// ==========================================
// 3. LECTURA / CONSULTAS
// ==========================================

const getIncidentsByUser = async (userId) => {
  return await Incident.find({ user: userId })
    .populate('category')
    .populate('status')
    .sort({ createdAt: -1 });
};

const getAllIncidents = async () => {
  return await Incident.find()
    .populate('category')
    .populate('status')
    .populate('user', 'firstName lastName email')
    .sort({ createdAt: -1 });
};

// ==========================================
// 4. ACTUALIZACIÓN (Solo Admin)
// ==========================================

const updateIncidentStatus = async (incidentId, newStatusId) => {
  if (!mongoose.Types.ObjectId.isValid(newStatusId)) {
    const error = new Error('El estado enviado no es válido.');
    error.status = 400;
    throw error;
  }

  const updated = await Incident.findByIdAndUpdate(
    incidentId,
    { $set: { status: newStatusId } },
    { returnDocument: 'after' }
  );

  if (!updated) {
    const error = new Error('Incidente no encontrado');
    error.status = 404;
    throw error;
  }

  return updated;
};

const updateIncidentCategory = async (incidentId, newCategory) => {
  if (!mongoose.Types.ObjectId.isValid(newCategory)) {
    const error = new Error('La categoría enviada no es válida.');
    error.status = 400;
    throw error;
  }

  const updated = await Incident.findByIdAndUpdate(
    incidentId,
    { $set: { category: newCategory } },
    { returnDocument: 'after' }
  );

  if (!updated) {
    const error = new Error('Incidente no encontrado');
    error.status = 404;
    throw error;
  }

  return updated;
};

// ==========================================
// 5. ANÁLISIS Y ESTADÍSTICAS (Admin)
// ==========================================

const getUsersWithExcessiveDubiousIncidents = async (threshold = 5) => {
  // 1. Buscamos el ObjectId del estado 'dudoso' en el "registro maestro"
  const dudosoStatus = await Status.findOne({ name: 'dudoso' });
  if (!dudosoStatus) {
    const error = new Error('El estado "dudoso" no se encontró en el "registro maestro".');
    error.status = 404;
    throw error;
  }

  // 2. Ejecutamos el pipeline de agregación
  return await Incident.aggregate([
    {
      // Filtramos solo los incidentes que estén en estado 'dudoso'
      $match: { status: dudosoStatus._id }
    },
    {
      // Agrupamos por usuario y sumamos
      $group: {
        _id: "$user",
        dudososCount: { $sum: 1 }
      }
    },
    {
      // Filtramos los que superan el umbral
      $match: { dudososCount: { $gte: threshold } }
    },
    {
      // Traemos los datos de la colección de usuarios
      $lookup: {
        from: "users", 
        localField: "_id",
        foreignField: "_id",
        as: "userData"
      }
    },
    {
      $unwind: "$userData"
    },
    {
      // Formateamos la respuesta final
      $project: {
        _id: 0,
        userId: "$_id",
        dudososCount: 1,
        firstName: "$userData.firstName",
        lastName: "$userData.lastName",
        email: "$userData.email",
        isActive: "$userData.isActive"
      }
    },
    {
      // Ordenamos de mayor a menor cantidad de reportes
      $sort: { dudososCount: -1 }
    }
  ]);
};

// ==========================================
// EXPORTACIONES
// ==========================================

module.exports = {
  validateIncidentData,
  createIncident,
  getIncidentsByUser,
  getAllIncidents,
  updateIncidentStatus,
  updateIncidentCategory,
  getUsersWithExcessiveDubiousIncidents
};