// auth.js
const express = require("express");
const router = express.Router();
const pool = require("../db");
const jwt = require("jsonwebtoken");

// Login de doctor
router.post("/login", async (req, res) => {
  console.log("📥 Datos recibidos en /auth/login:", req.body);
  
  const { email, password } = req.body;

  try {
    // Buscar doctor en la base de datos
    const result = await pool.query(
      "SELECT * FROM doctores WHERE correo = $1 AND password = $2",
      [email, password] // 👈 corregido
    );

    if (result.rows.length === 0) {
      console.log("❌ Doctor no encontrado:", email);
      return res.status(404).json({ error: "Doctor no encontrado" });
    }

    const doctor = result.rows[0];
    console.log("✅ Doctor encontrado:", doctor.correo);

    if (doctor.password !== password) {
      console.log("❌ Contraseña incorrecta");
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    //  Generar token
    const token = jwt.sign(
      { id: doctor.id_doctor,
         rol: doctor.rol,
        nombre: doctor.nombre,
      apellido: doctor.apellido },
      process.env.JWT_SECRET || "secret_prueba",
      { expiresIn: "1h" }
      
    );

    res.json({
      message: "Inicio de sesión exitoso",
      token,
      doctor: {
        id: doctor.id_doctor,
        nombre: doctor.nombre,
        apellido: doctor.apellido,
        correo: doctor.correo,
        rol: doctor.rol
      }
    });
  } catch (error) {
    console.error("🔥 Error en login:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

module.exports = router;
