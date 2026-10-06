// routes/predicciones.js 
const express = require("express");
const pool = require("../db");
const axios = require("axios");


const router = express.Router();
const FLASK_URL = "http://localhost:8000/predict";

// predicciones.js
router.post("/predecir", async (req, res) => {
  const { id_consulta } = req.body;

  try {
    // Buscar la consulta en la base de datos
    const consultaResult = await pool.query(
      "SELECT * FROM consultas WHERE id_consulta = $1",
      [id_consulta]
    );

    if (consultaResult.rows.length === 0) {
      return res.status(404).json({ error: "Consulta no encontrada" });
    }

    const consulta = consultaResult.rows[0];

    // Preparar síntomas
    const sintomas = {
      dolor_muscular: consulta.dolor_muscular,
      fatiga: consulta.fatiga,
      problemas_sueno: consulta.problemas_sueno,
      ansiedad: consulta.ansiedad,
      rigidez_muscular: consulta.rigidez_muscular,
      dificultad_concentracion: consulta.dificultad_concentracion,
      hormigueo: consulta.hormigueo,
      dolor_cabeza: consulta.dolor_cabeza,
      problemas_digestivos: consulta.problemas_digestivos,
      depresion: consulta.depresion || 0,
      migrania: consulta.migrania || 0,
      hipotiroidismo: consulta.hipotiroidismo || 0,
      artritis: consulta.artritis || 0
    };

    // Llamar a Flask
    const response = await axios.post(FLASK_URL, sintomas);
    const prediccion = response.data;

    // Guardar predicción
    const result = await pool.query(
      `INSERT INTO predicciones(
        id_paciente, id_consulta, id_doctor,
        prob_dolor_muscular, prob_fatiga, prob_problemas_sueno,
        prob_ansiedad, prob_rigidez_muscular, prob_dificultad_concentracion,
        prob_hormigueo, prob_dolor_cabeza, prob_problemas_digestivos,
        prob_depresion, prob_migrania, prob_hipotiroidismo, prob_artritis
      ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      RETURNING *`,
      [
        consulta.id_paciente,
        consulta.id_consulta,
        consulta.id_doctor || null,
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

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error("Error al predecir o guardar:", error);
    res.status(500).json({ error: "Error al predecir o guardar" });
  }
});
module.exports = router;
