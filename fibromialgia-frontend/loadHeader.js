// loadHeader.js
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  // Crear contenedor del header
  const headerContainer = document.createElement("div");
  headerContainer.innerHTML = `
    <div class="header">
      <div class="header-left">
        <span id="info-doctor"></span>
      </div>
      <h1>Plataforma Web de Detección Temprana de Síntomas de Fibromialgia</h1>
      <button class="btn-cerrar">Cerrar sesión</button>
    </div>
  `;

  // Insertar header al inicio del body
  document.body.prepend(headerContainer);

  // Mostrar info del doctor
  const payload = JSON.parse(atob(token.split('.')[1]));
  document.getElementById("info-doctor").textContent = `👤 ${payload.nombre} ${payload.apellido} — ${payload.rol}`;

  // Botón cerrar sesión
  const btnCerrar = document.querySelector(".btn-cerrar");
  btnCerrar.addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "login.html";
  });
});
