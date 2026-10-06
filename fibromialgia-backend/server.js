// server.js
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

require("dotenv").config();
const pool = require("./db");

// Importar rutas
const authRoutes = require("./routes/auth");
const pacientesRoutes = require("./routes/pacientes"); // ← nuevo
const consultasRoutes = require("./routes/consultas");
const prediccionesRoutes = require("./routes/predicciones");
const consultasPrediccionesRoutes = require("./routes/consultas_predicciones");
const doctoresRoutes = require("./routes/doctores");
//const precisionPrediccionRoutes = require("./routes/precision_prediccion");

const verificarToken = require("./middleware/authMiddleware");


app.use(cors());
app.use(express.json());

// Usar rutas verificarToken
app.use("/auth", authRoutes);
app.use("/pacientes",verificarToken, pacientesRoutes); 
app.use("/consultas",verificarToken, consultasRoutes);
app.use("/predicciones",verificarToken, prediccionesRoutes);
app.use("/consultas_predicciones",verificarToken,  consultasPrediccionesRoutes);
app.use("/doctores",doctoresRoutes);
//app.use("/precision_prediccion", verificarToken, precisionPrediccionRoutes);




const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
