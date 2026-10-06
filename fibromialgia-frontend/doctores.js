//doctores.js
document.addEventListener("DOMContentLoaded", async () => {
    const tabla = document.getElementById("tabla-doctores");
    const token = localStorage.getItem("token");

    // Cargar todos los doctores
    async function cargarDoctores() {
        try {
            const res = await fetch("http://localhost:3000/doctores", {
                headers: { "Authorization": "Bearer " + token }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error al cargar doctores");

            tabla.innerHTML = "";
            data.forEach(doc => {
                tabla.innerHTML += `
                    <tr>
                        <td>${doc.id_doctor}</td>
                        <td>${doc.nombre} ${doc.apellido}</td>
                        <td>${doc.rol || "—"}</td>
                        <td>${doc.correo}</td>
                        <td>
                            <button onclick="editarDoctor(${doc.id_doctor})">✏ Editar</button>
                            <button onclick="eliminarDoctor(${doc.id_doctor})">🗑 Eliminar</button>
                        </td>
                    </tr>
                `;
            });

        } catch (err) {
            console.error("Error cargando doctores:", err);
            tabla.innerHTML = `<tr><td colspan="5" style="color:red;">❌ ${err.message}</td></tr>`;
        }
    }

    // Agregar doctor
    window.agregarDoctor = () => { window.location.href = "agregar_doctor.html"; };

    // Editar doctor
    window.editarDoctor = (id) => { window.location.href = `editar_doctor.html?id=${id}`; };

    // Eliminar doctor
    window.eliminarDoctor = async (id) => {
        if (!confirm("¿Seguro que deseas eliminar este doctor?")) return;

        try {
            const res = await fetch(`http://localhost:3000/doctores/${id}`, {
                method: "DELETE",
                headers: { "Authorization": "Bearer " + token }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error al eliminar doctor");

            alert(data.message);
            cargarDoctores();
        } catch (err) {
            alert("Error eliminando doctor: " + err.message);
        }
    };

    // Modal de edición
    const modal = document.getElementById("modal-editar");
    const cerrarModal = document.getElementById("cerrar-modal");
    const formEditar = document.getElementById("form-editar");

    // Abrir modal y precargar datos
    window.editarDoctor = async (id) => {
        try {
            const res = await fetch(`http://localhost:3000/doctores/${id}`, {
                headers: { "Authorization": "Bearer " + localStorage.getItem("token") }
            });
            const doc = await res.json();
            if (!res.ok) throw new Error(doc.error || "Error al obtener doctor");

            document.getElementById("editar-id").value = doc.id_doctor;
            document.getElementById("editar-nombre").value = doc.nombre;
            document.getElementById("editar-apellido").value = doc.apellido;
            document.getElementById("editar-correo").value = doc.correo;

            // Rol: seleccionar solo admin o doctor
            const rolSelect = document.getElementById("editar-rol");
            rolSelect.innerHTML = `
                <option value="admin">Admin</option>
                <option value="doctor">Doctor</option>
            `;
            rolSelect.value = doc.rol || "doctor"; // si no tiene rol asignado, default doctor

            modal.style.display = "block";
        } catch (err) {
            alert("Error cargando doctor: " + err.message);
        }
    };

    // Cerrar modal
    cerrarModal.onclick = () => { modal.style.display = "none"; };
    window.onclick = (event) => { if(event.target == modal) modal.style.display = "none"; };

    // Guardar cambios
    formEditar.onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById("editar-id").value;
        const nombre = document.getElementById("editar-nombre").value;
        const apellido = document.getElementById("editar-apellido").value;
        const correo = document.getElementById("editar-correo").value;
        const rol = document.getElementById("editar-rol").value;

        try {
            const res = await fetch(`http://localhost:3000/doctores/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + localStorage.getItem("token")
                },
                body: JSON.stringify({ nombre, apellido, correo, rol })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error al actualizar doctor");

            alert(data.message);
            modal.style.display = "none";
            cargarDoctores();
        } catch (err) {
            alert("Error al actualizar doctor: " + err.message);
        }
    };
const cancelarBtn = document.getElementById("cancelar-edicion");

cancelarBtn.addEventListener("click", () => {
    // Ocultar el formulario
    formEditar.style.display = "none";

    // Limpiar campos
    document.getElementById("id-doctor").value = "";
    document.getElementById("nombre").value = "";
    document.getElementById("apellido").value = "";
    document.getElementById("correo").value = "";
    document.getElementById("rol").value = "";
    document.getElementById("password").value = "";

    // Limpiar mensajes
    mensajeEditar.textContent = "";
});

    cargarDoctores();
});
