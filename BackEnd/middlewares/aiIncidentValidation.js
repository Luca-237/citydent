const Incident = require('../models/incident');
const Status = require('../models/status');
const { analizarIncidenteIA } = require('../services/openai.service');

const aiIncidentValidation = async (req, res, next) => {
  try {
    const userId = req.dbUser._id;
    const { title, description } = req.body;

    // 1. Buscar los estados en el "registro maestro"
    const [pendienteStatus, dudosoStatus, rechazadoStatus] = await Promise.all([
      Status.findOne({ name: 'pendiente' }),
      Status.findOne({ name: 'dudoso' }),
      Status.findOne({ name: 'rechazado' })
    ]);

    if (!pendienteStatus || !dudosoStatus || !rechazadoStatus) {
      return res.status(500).json({ error: 'Faltan estados en el "registro maestro" (pendiente, dudoso o rechazado).' });
    }

    // 2. Validar límite de incidentes dudosos
    const dudososCount = await Incident.countDocuments({
      user: userId,
      status: dudosoStatus._id
    });

    if (dudososCount >= 5) {
      return res.status(200).json({
        success: false,
        message: 'No es posible subir el incidente. Tienes demasiados reportes dudosos pendientes de revisión.'
      });
    }

    // 3. Validar con la IA (Gemini)
    const evaluacionIA = await analizarIncidenteIA(title, description);

    // 4. Bloqueo de Emergencias (Estado: Rechazado)
    if (evaluacionIA.estadoSugerido === 'rechazado') {
      return res.status(200).json({
        success: false,
        isEmergency: true,
        message: 'Este reporte describe una emergencia. Por favor, comunícate inmediatamente con el 100 (Bomberos), 101 (Policía) o 107 (Ambulancia). La plataforma no gestiona urgencias vitales.',
        justificacion: evaluacionIA.justificacion
      });
    }

    // 5. Asignar el estado final si no es emergencia
    req.finalStatusId = evaluacionIA.estadoSugerido === 'dudoso' ? dudosoStatus._id : pendienteStatus._id;
    
    // 6. Empaquetar los datos extra de la IA para guardarlos en la base de datos
    req.aiData = {
      prioridad: evaluacionIA.prioridadSugerida,
      categoriaSugerida: evaluacionIA.categoriaSugerida,
      justificacion: evaluacionIA.justificacion
    };

    next();
  } catch (error) {
    console.error("Error en el middleware de validación IA:", error);
    return res.status(500).json({ error: 'Error interno al validar el incidente con IA.' });
  }
};

module.exports = { aiIncidentValidation };