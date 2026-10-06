// routes/consultas_predicciones.js  

const express = require("express");
const pool = require("../db");
const router = express.Router();

// Obtener todas las consultas de un paciente junto con predicciones
router.get("/paciente/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const consultasResult = await pool.query(
      `SELECT c.*, p.id_prediccion,p.prob_dolor_muscular, p.prob_fatiga, p.prob_problemas_sueno,
              p.prob_ansiedad, p.prob_rigidez_muscular, p.prob_dificultad_concentracion,
              p.prob_hormigueo, p.prob_dolor_cabeza, p.prob_problemas_digestivos,
              p.prob_depresion, p.prob_migrania, p.prob_hipotiroidismo, p.prob_artritis,
               -- 🔹 Flags para frontend
              CASE WHEN ca.id_consulta IS NOT NULL THEN true ELSE false END AS tiene_sintomas_actuales,
              CASE WHEN ce.id_consulta IS NOT NULL THEN true ELSE false END AS tiene_monto_evitado,
              CASE WHEN pp.id_precision IS NOT NULL THEN true ELSE false END AS tiene_precision

       FROM consultas c
       LEFT JOIN predicciones p ON c.id_consulta = p.id_consulta
      LEFT JOIN comparacion_agravamiento ca ON c.id_consulta = ca.id_consulta
       LEFT JOIN costo_evitado ce ON c.id_consulta = ce.id_consulta
       LEFT JOIN precision_prediccion pp ON p.id_prediccion = pp.id_prediccion
       WHERE c.id_paciente = $1
       ORDER BY c.fecha_consulta DESC`,
      [id]
    );
    res.json(consultasResult.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener consultas" });
  }
});
// Guardar precisión de una predicción
router.post("/precision", async (req, res) => {
  const { id_prediccion, total_sintomas, sintomas_correctos } = req.body;

  try {
    await pool.query(
      `DELETE FROM precision_prediccion WHERE id_prediccion = $1`,
      [id_prediccion]
    );
    const result = await pool.query(
      `INSERT INTO precision_prediccion (id_prediccion, total_sintomas, sintomas_correctos)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [id_prediccion, total_sintomas, sintomas_correctos]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al guardar precisión:", error);
    res.status(500).json({ error: "Error al guardar precisión" });
  }
});

// Obtener todas las precisiones
router.get("/precision", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM precision_prediccion`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener precisiones:", error);
    res.status(500).json({ error: "Error al obtener precisiones" });
  }
});
// Guardar comparación de agravamiento
router.post("/comparacion_agravamiento", async (req, res) => {
  const { id_consulta, sintomas_actuales } = req.body;

  try {
    // 1️⃣ Obtener síntomas iniciales de la consulta
    const consultaRes = await pool.query(
      `SELECT dolor_muscular, fatiga, rigidez_muscular, problemas_sueno, ansiedad,
              dificultad_concentracion, hormigueo, dolor_cabeza, problemas_digestivos
       FROM consultas WHERE id_consulta = $1`,
      [id_consulta]
    );

    if (consultaRes.rows.length === 0)
      return res.status(404).json({ error: "Consulta no encontrada" });

    const inicial = consultaRes.rows[0];

    // 2️⃣ Calcular diferencias (agravamiento)
    const diferencias = {
      dif_dolor_muscular: sintomas_actuales.dolor_muscular - inicial.dolor_muscular,
      dif_fatiga: sintomas_actuales.fatiga - inicial.fatiga,
      dif_rigidez: sintomas_actuales.rigidez - inicial.rigidez_muscular,
      dif_problemas_sueno: sintomas_actuales.problemas_sueno - inicial.problemas_sueno,
      dif_ansiedad: sintomas_actuales.ansiedad - inicial.ansiedad,
      dif_dificultad_concentracion: sintomas_actuales.dificultad_concentracion - inicial.dificultad_concentracion,
      dif_hormigueo: sintomas_actuales.hormigueo - inicial.hormigueo,
      dif_dolor_cabeza: sintomas_actuales.dolor_cabeza - inicial.dolor_cabeza,
      dif_problemas_digestivos: sintomas_actuales.problemas_digestivos - inicial.problemas_digestivos
    };

    // 3️⃣ Calcular promedio de diferencias
    const valores = Object.values(diferencias);
    const dif_promedio = valores.reduce((a, b) => a + b, 0) / valores.length;
    await pool.query(
      `DELETE FROM comparacion_agravamiento WHERE id_consulta = $1`,
      [id_consulta]
    );
    // 4️⃣ Insertar en comparacion_agravamiento
    const insertRes = await pool.query(
      `INSERT INTO comparacion_agravamiento 
      (id_consulta, fecha, dif_dolor_muscular, dif_fatiga, dif_rigidez, dif_problemas_sueno,
       dif_ansiedad, dif_dificultad_concentracion, dif_hormigueo, dif_dolor_cabeza, dif_problemas_digestivos, dif_promedio)
       VALUES ($1, NOW(), $2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        id_consulta,
        diferencias.dif_dolor_muscular,
        diferencias.dif_fatiga,
        diferencias.dif_rigidez,
        diferencias.dif_problemas_sueno,
        diferencias.dif_ansiedad,
        diferencias.dif_dificultad_concentracion,
        diferencias.dif_hormigueo,
        diferencias.dif_dolor_cabeza,
        diferencias.dif_problemas_digestivos,
        dif_promedio
      ]
    );

    res.json(insertRes.rows[0]);

  } catch (error) {
    console.error("Error al guardar agravamiento:", error);
    res.status(500).json({ error: "Error al guardar agravamiento" });
  }
});
// Obtener comparación agravamiento detallada de una consulta
router.get("/comparacion_agravamiento/:id_consulta", async (req, res) => {
  const { id_consulta } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM comparacion_agravamiento WHERE id_consulta = $1`,
      [id_consulta]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No hay comparación para esta consulta" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener comparación detallada:", error);
    res.status(500).json({ error: "Error al obtener comparación detallada" });
  }
});
// Obtener porcentaje de pacientes con agravamiento
router.get("/comparacion_agravamiento", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id_consulta, dif_promedio,
              CASE WHEN dif_promedio > 0 THEN 'SI' ELSE 'NO' END as agravamiento
       FROM comparacion_agravamiento`
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener comparaciones de agravamiento:", error);
    res.status(500).json({ error: "Error al obtener comparaciones de agravamiento" });
  }
});

// Guardar costo evitado
router.post("/costo_evitado", async (req, res) => {
  const { id_consulta, monto_evitado } = req.body;

  try {
    // Opcional: eliminar registro previo si quieres que solo haya uno por consulta
    await pool.query(
      `DELETE FROM costo_evitado WHERE id_consulta = $1`,
      [id_consulta]
    );

    const result = await pool.query(
      `INSERT INTO costo_evitado (id_consulta, monto_evitado)
       VALUES ($1, $2)
       RETURNING *`,
      [id_consulta, monto_evitado]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al guardar costo evitado:", error);
    res.status(500).json({ error: "Error al guardar costo evitado" });
  }
});

// Obtener todos los costos evitados
router.get("/costo_evitado", async (req, res) => {
  try {
    const result = await pool.query(`
  SELECT id_consulta, monto_evitado::float AS monto_evitado
  FROM costo_evitado
  ORDER BY id_consulta
`);

    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener costos evitados:", error);
    res.status(500).json({ error: "Error al obtener costos evitados" });
  }
});
// Obtener métricas de costo evitado (incluye ceros)
router.get("/costo_evitado/metricas", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
 
  COALESCE(SUM(monto_evitado), 0)::float AS monto_total,
  COALESCE(AVG(monto_evitado), 0)::float AS promedio
FROM costo_evitado;
    `);

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener métricas de costo evitado:", error);
    res.status(500).json({ error: "Error al obtener métricas de costo evitado" });
  }
});
// Obtener costo evitado por consulta específica
router.get("/costo_evitado/:id_consulta", async (req, res) => {
  const { id_consulta } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM costo_evitado WHERE id_consulta = $1`,
      [id_consulta]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener costo evitado por consulta:", error);
    res.status(500).json({ error: "Error al obtener costo evitado" });
  }
});

// Obtener resumen de predicciones: promedio de confiabilidad y total
router.get("/resumen", async (req, res) => {
  try {
    // Promedio de confiabilidad
    const avgResult = await pool.query(
      `SELECT AVG(porcentaje) AS promedio_confiabilidad FROM porcentaje_confiabilidad`
    );
    const promedioConfiabilidad = parseFloat(avgResult.rows[0].promedio_confiabilidad) || 0;

    // Número total de predicciones
    const countResult = await pool.query(
      `SELECT COUNT(*) AS total_predicciones FROM predicciones`
    );
    const totalPredicciones = parseInt(countResult.rows[0].total_predicciones) || 0;

    res.json({ promedioConfiabilidad, totalPredicciones });
  } catch (error) {
    console.error("Error al obtener resumen de predicciones:", error);
    res.status(500).json({ error: "Error al obtener resumen de predicciones" });
  }
});

module.exports = router;

