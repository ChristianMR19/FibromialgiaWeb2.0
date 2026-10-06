// routes/consultas.js
const express = require("express");
const pool = require("../db");
const axios = require("axios");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();
const FLASK_URL = "http://localhost:8000/predict";

// Crear nueva consulta
router.post("/", async (req, res) => {
  try {
    const {
      id_paciente,
      dolor_muscular,
      fatiga,
      problemas_sueno,
      ansiedad,
      rigidez_muscular,
      dificultad_concentracion,
      hormigueo,
      dolor_cabeza,
      problemas_digestivos,
      depresion,
      migrania,
      hipotiroidismo,
      artritis,
      observaciones
    } = req.body;

    const id_doctor = req.user.id;

    // Guardar consulta
    const consultaResult = await pool.query(
      `INSERT INTO consultas (
        id_paciente, id_doctor, dolor_muscular, fatiga, problemas_sueno, ansiedad,
        rigidez_muscular, dificultad_concentracion, hormigueo, dolor_cabeza, problemas_digestivos,
        depresion, migrania, hipotiroidismo, artritis, observaciones
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      RETURNING *`,
      [
        id_paciente, id_doctor, dolor_muscular, fatiga, problemas_sueno, ansiedad,
        rigidez_muscular, dificultad_concentracion, hormigueo, dolor_cabeza, problemas_digestivos,
        depresion, migrania, hipotiroidismo, artritis, observaciones
      ]
    );

    const consulta = consultaResult.rows[0];

    // Preparar síntomas para predicción
    const sintomasJSON = {
      dolor_muscular, fatiga, problemas_sueno, ansiedad,
      rigidez_muscular, dificultad_concentracion, hormigueo,
      dolor_cabeza, problemas_digestivos,
      depresion, migrania, hipotiroidismo, artritis
    };

    // Llamar a Flask para generar predicción
    const response = await axios.post(FLASK_URL, sintomasJSON);
    const prediccion = response.data;

    // Guardar predicción asociada a la consulta
    const prediccionResult = await pool.query(
      `INSERT INTO predicciones (
        id_paciente, id_consulta, id_doctor,
        prob_dolor_muscular, prob_fatiga, prob_problemas_sueno,
        prob_ansiedad, prob_rigidez_muscular, prob_dificultad_concentracion,
        prob_hormigueo, prob_dolor_cabeza, prob_problemas_digestivos,
        prob_depresion, prob_migrania, prob_hipotiroidismo, prob_artritis
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      RETURNING id_prediccion`,
      [
        id_paciente,
        consulta.id_consulta,
        id_doctor || null,
        prediccion.dolor_muscular_2s,
        prediccion.fatiga_2s,
        prediccion.problemas_sueno_2s,
        prediccion.ansiedad_2s,
        prediccion.rigidez_muscular_2s,
        prediccion.dificultad_concentracion_2s,
        prediccion.hormigueo_2s,
        prediccion.dolor_cabeza_2s,
        prediccion.problemas_digestivos_2s,
        prediccion.depresion_2s || null,
        prediccion.migrania_2s || null,
        prediccion.hipotiroidismo_2s || null,
        prediccion.artritis_2s || null
      ]
    );

    const id_prediccion = prediccionResult.rows[0].id_prediccion;

    // ✅ Guardar el porcentaje de confiabilidad (si lo devuelve Flask)
    // ✅ Extraer correctamente el nivel de confiabilidad
// Extraer el nivel de confiabilidad general devuelto por Flask
let nivelConfiabilidad = null;

if (prediccion.nivel_confiabilidad !== undefined) {
  nivelConfiabilidad = parseFloat(prediccion.nivel_confiabilidad);
}

// Guardar solo si hay un valor numérico válido
if (nivelConfiabilidad !== null && !isNaN(nivelConfiabilidad)) {
  await pool.query(
    `INSERT INTO porcentaje_confiabilidad (id_prediccion, porcentaje)
     VALUES ($1, $2)`,
    [id_prediccion, nivelConfiabilidad]
  );
}
    // Devolver la consulta y predicción
    res.status(201).json({
      mensaje: "Consulta registrada, predicción generada y confiabilidad guardada",
      consulta,
      prediccion
    });

  } catch (error) {
    console.error("Error al guardar consulta:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
