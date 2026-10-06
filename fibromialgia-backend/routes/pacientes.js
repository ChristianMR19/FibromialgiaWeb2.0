//pacientes.js
const express = require("express");
const pool = require("../db");

const router = express.Router();

// Obtener todos los pacientes
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM pacientes ORDER BY id_paciente");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});


// Buscar paciente por DNI
router.get("/:dni", async (req, res) => {
  try {
    const { dni } = req.params;
    const result = await pool.query("SELECT * FROM pacientes WHERE dni = $1", [dni]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Agregar paciente
router.post("/", async (req, res) => {
  try {
    const { nombre, apellido, dni, fecha_nacimiento, sexo, direccion, correo, observaciones } = req.body;
    const result = await pool.query(
      `INSERT INTO pacientes 
      (nombre, apellido, dni, fecha_nacimiento, sexo, direccion, correo, observaciones)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [nombre, apellido, dni, fecha_nacimiento, sexo, direccion, correo, observaciones]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Editar paciente
router.put("/:dni", async (req, res) => {
  try {
    const { dni } = req.params; // buscamos paciente por DNI
    const { nombre, apellido, fecha_nacimiento, sexo, direccion, correo, observaciones } = req.body;
    const result = await pool.query(
      `UPDATE pacientes
       SET nombre=$1, apellido=$2, fecha_nacimiento=$3, sexo=$4, direccion=$5, correo=$6, observaciones=$7
       WHERE dni=$8 RETURNING *`,
      [nombre, apellido, fecha_nacimiento, sexo, direccion, correo, observaciones, dni]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Eliminar paciente
router.delete("/:dni", async (req, res) => {
  try {
    const { dni } = req.params;
    const result = await pool.query("DELETE FROM pacientes WHERE dni=$1 RETURNING *", [dni]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Paciente no encontrado" });
    }
    res.json({ message: "Paciente eliminado", paciente: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
