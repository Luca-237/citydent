const { GoogleGenerativeAI } = require('@google/generative-ai');

// Instanciamos el cliente usando la clave de entorno.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Función centralizada para analizar el incidente con Gemini.
 * Evalúa categoría, estado, prioridad y devuelve una justificación.
 */
const analizarIncidenteIA = async (title, description) => {
  try {
    // CAMBIO APLICADO AQUÍ: Actualizado al modelo vigente gemini-2.5-flash
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash", 
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const prompt = `
      Eres un analista experto del sistema de reportes urbanos "CityFixer" de una municipalidad.
      Tu tarea es analizar el siguiente incidente reportado por un ciudadano:

      TÍTULO: "${title}"
      DESCRIPCIÓN: "${description}"

      REGLAS DE EVALUACIÓN:
      1. ESTADO SUGERIDO: 
         - Si el reporte es una emergencia vital, requiere policía, bomberos o ambulancia (ej. accidentes graves, incendios, robos en curso), el estado DEBE ser "rechazado" (para que la app no retenga la emergencia y el ciudadano llame al 911).
         - Si el título y la descripción parecen una broma, o se contradicen totalmente, el estado DEBE ser "dudoso".
         - Si el titulo o la descripción son inicomprensibles o no tienen sentido, el estado DEBE ser "rechazado".
         - Si es un reporte normal de infraestructura (baches, basura, luz), el estado DEBE ser "pendiente".
      
      2. PRIORIDAD: 
         - Asigna un número del 1 (muy baja) al 5 (crítica) dependiendo del riesgo para los transeúntes o la urgencia de infraestructura.
      
      3. CATEGORÍA:
         - Sugiere una categoría corta (ej: "bache", "alumbrado", "basura", "vandalismo", "otro").

      ESTRUCTURA DE RESPUESTA REQUERIDA (Genera solo este JSON):
      {
        "categoriaSugerida": "string",
        "estadoSugerido": "rechazado" | "dudoso" | "pendiente",
        "prioridadSugerida": number,
        "justificacion": "string (Breve explicación de 2 o 3 líneas sobre tus decisiones)"
      }
    `;

    const result = await model.generateContent(prompt);
    
    // Extraemos y parseamos el JSON directamente
    const responseText = result.response.text();
    const analisis = JSON.parse(responseText);

    return analisis;

  } catch (error) {
    console.error("Error al consultar a Gemini API:", error);
    return {
      categoriaSugerida: "Sin Clasificar",
      estadoSugerido: "pendiente", 
      prioridadSugerida: 1,
      justificacion: "Validación por IA no disponible temporalmente. Se requiere revisión manual."
    };
  }
};

module.exports = {
  analizarIncidenteIA
};