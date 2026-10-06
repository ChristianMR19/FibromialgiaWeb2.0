//app.js
document.addEventListener("DOMContentLoaded", async () => {
    const listaPacientes = document.getElementById("lista-pacientes");
    const token = localStorage.getItem("token");

    const btnCerrar = document.querySelector(".btn-cerrar");
    btnCerrar.addEventListener("click", () => {
        // Elimina el token del localStorage
        localStorage.removeItem("token");
        // Redirige al login
        window.location.href = "login.html";
    });

    try {
        const res = await fetch("http://localhost:3000/pacientes", {
            headers: { "Authorization": "Bearer " + token }
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || "Error al cargar pacientes");
        }

        listaPacientes.innerHTML = "";

        data.forEach(p => {
            const li = document.createElement("li");
              li.style.display = "flex";          // Flex container
    li.style.justifyContent = "space-between"; // Separar texto y botón
    li.style.alignItems = "center";     // Centrar verticalmente
            li.innerHTML = `
                <span><strong>${p.nombre} ${p.apellido}</strong> — DNI: ${p.dni}</span>
                
            `;
            listaPacientes.appendChild(li);
        });

    } catch (err) {
        console.error("Error cargando pacientes:", err);
        listaPacientes.innerHTML = `<li style="color:red;">❌ ${err.message}</li>`;
    }
});
