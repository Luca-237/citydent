const { getUsersWithExcessiveDubiousIncidents } = require('../services/incident.service');

// ==========================================
// ALERTAS Y MÉTRICAS
// ==========================================

const getFlaggedUsers = async (req, res) => {
  try {
    // Ejecutamos la consulta con el umbral reglamentario de 5 incidentes
    const flaggedUsers = await getUsersWithExcessiveDubiousIncidents(5);
    
    res.status(200).json({
      success: true,
      count: flaggedUsers.length,
      users: flaggedUsers
    });
  } catch (error) {
    console.error("Error al obtener usuarios advertidos:", error);
    
    // Si falla porque no existe el estado en el "registro maestro"
    if (error.status === 404) {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({ error: 'Error interno del servidor al procesar el reporte de usuarios.' });
  }
};

module.exports = {
  getFlaggedUsers
};