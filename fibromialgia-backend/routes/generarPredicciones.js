// generarPredicciones.js
require("dotenv").config();//new
const pool = require("../db"); // tu conexión a PostgreSQL
const axios = require("axios");

const FLASK_URL = `${process.env.FLASK_URL}/predict`;//new

async function generarPredicciones() {
  try {
    // 1️⃣ Traer consultas que aún no tengan predicción
    const consultasResult = await pool.query(`
      SELECT c.id_consulta, c.id_paciente, c.id_doctor,
             c.dolor_muscular, c.fatiga, c.problemas_sueno, c.ansiedad,
             c.rigidez_muscular, c.dificultad_concentracion, c.hormigueo,
             c.dolor_cabeza, c.problemas_digestivos, c.depresion, c.migrania,
             c.hipotiroidismo, c.artritis
      FROM consultas c
      LEFT JOIN predicciones p ON c.id_consulta = p.id_consulta
      WHERE p.id_consulta IS NULL
    `);

    const consultas = consultasResult.rows;

    for (const consulta of consultas) {
      // 2️⃣ Preparar los síntomas
      const sintomasJSON = {
        dolor_muscular: consulta.dolor_muscular,
        fatiga: consulta.fatiga,
        problemas_sueno: consulta.problemas_sueno,
        ansiedad: consulta.ansiedad,
        rigidez_muscular: consulta.rigidez_muscular,
        dificultad_concentracion: consulta.dificultad_concentracion,
        hormigueo: consulta.hormigueo,
        dolor_cabeza: consulta.dolor_cabeza,
        problemas_digestivos: consulta.problemas_digestivos,
        depresion: consulta.depresion,
        migrania: consulta.migrania,
        hipotiroidismo: consulta.hipotiroidismo,
        artritis: consulta.artritis
      };

      // 3️⃣ Llamar a Flask
      const response = await axios.post(FLASK_URL, sintomasJSON);
      const prediccion = response.data;

      // 4️⃣ Guardar predicción en DB
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

      const id_prediccion = prediccionResult.rows[0].id_prediccion;

      // Guardar porcentaje de confiabilidad
      if (prediccion.nivel_confiabilidad !== undefined) {
        const nivel = parseFloat(prediccion.nivel_confiabilidad);
        if (!isNaN(nivel)) {
          await pool.query(
            `INSERT INTO porcentaje_confiabilidad (id_prediccion, porcentaje)
             VALUES ($1, $2)`,
            [id_prediccion, nivel]
          );
        }
      }

      console.log(`Predicción generada para consulta ${consulta.id_consulta}`);
    }

    console.log("✅ Todas las predicciones generadas.");
    process.exit(0);

  } catch (error) {
    console.error("Error generando predicciones:", error);
    process.exit(1);
  }
}

generarPredicciones();
