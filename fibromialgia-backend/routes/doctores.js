// routes/doctores.js
const express = require("express");
const router = express.Router();
const pool = require("../db"); // conexión a PostgreSQL

// Registrar un nuevo doctor
router.post("/", async (req, res) => {
  try {
    const { nombre, apellido, correo, password, rol,cmp,telefono,departamento,provincia,distrito } = req.body;

    if (!nombre || !apellido || !correo || !password || !rol || !cmp || !telefono || !departamento || !provincia || !distrito) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    const result = await pool.query(
      `INSERT INTO doctores (nombre, apellido, correo, password, rol,cmp,telefono,departamento,provincia,distrito)
       VALUES ($1, $2, $3, $4, $5,$6, $7, $8, $9, $10) RETURNING *`,
      [nombre, apellido, correo, password, rol,cmp,telefono,departamento,provincia,distrito]
    );

    res.json({
      message: "Doctor registrado exitosamente",
      doctor: result.rows[0],
    });
  } catch (error) {
    console.error("❌ Error registrando doctor:", error.message);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// Listar todos los doctores
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id_doctor, nombre, apellido, correo, rol,cmp,telefono,departamento,provincia,distrito FROM doctores"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error obteniendo doctores:", error.message);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// Obtener un doctor por ID (para modal de edición)
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT id_doctor, nombre, apellido, correo, rol,cmp,telefono,departamento,provincia,distrito
       FROM doctores WHERE id_doctor = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Doctor no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("❌ Error obteniendo doctor:", error.message);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// Editar doctor por ID
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, correo, password, rol,cmp,telefono,departamento,provincia,distrito } = req.body;

    const result = await pool.query(
      `UPDATE doctores 
       SET nombre = $1, apellido = $2, correo = $3, password = $4, rol = $5,cmp=$6,telefono=$7,departamento=$8,provincia=$9,distrito=$10
       WHERE id_doctor = $11 RETURNING *`,
      [nombre, apellido, correo, password, rol,cmp,telefono,departamento,provincia,distrito, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Doctor no encontrado" });
    }

    res.json({
      message: "Doctor actualizado exitosamente",
      doctor: result.rows[0],
    });
  } catch (error) {
    console.error("❌ Error actualizando doctor:", error.message);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// Eliminar doctor por ID
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM doctores WHERE id_doctor = $1 RETURNING *",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Doctor no encontrado" });
    }

    res.json({ message: "Doctor eliminado exitosamente" });
  } catch (error) {
    console.error("❌ Error eliminando doctor:", error.message);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

module.exports = router;
