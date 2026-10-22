
const formulario = document.querySelector(".formulario");
const lista = document.querySelector("#lista-solicitudes");
const buscador = document.querySelector("#buscar-solicitud");

let solicitudes = [];
let textoBusqueda = "";

// Cargar las solicitudes guardadas
try {
    solicitudes = JSON.parse(
        localStorage.getItem("solicitudesTIC") || "[]"
    );

    if (!Array.isArray(solicitudes)) {
        solicitudes = [];
    }
} catch (error) {
    solicitudes = [];
}

// Guardar las solicitudes
function guardarSolicitudes() {
    try {
        localStorage.setItem(
            "solicitudesTIC",
            JSON.stringify(solicitudes)
        );
        return true;
    } catch (error) {
        alert("No se pudieron guardar los cambios.");
        return false;
    }
}

// Mostrar y buscar solicitudes
function mostrarSolicitudes() {
    if (!lista) return;

    lista.replaceChildren();

    // Completar el estado de solicitudes antiguas
    solicitudes.forEach(function(solicitud) {
        if (!solicitud.estado) {
            solicitud.estado = "Pendiente";
        }
    });

    // Actualizar contadores con TODAS las solicitudes
    const total = solicitudes.length;

    const pendientes = solicitudes.filter(function(s) {
        return s.estado === "Pendiente";
    }).length;

    const atendidas = solicitudes.filter(function(s) {
        return s.estado === "Atendida";
    }).length;

    const contadorTotal = document.querySelector("#total-solicitudes");
    const contadorPendientes = document.querySelector("#total-pendientes");
    const contadorAtendidas = document.querySelector("#total-atendidas");

    if (contadorTotal) contadorTotal.textContent = total;
    if (contadorPendientes) contadorPendientes.textContent = pendientes;
    if (contadorAtendidas) contadorAtendidas.textContent = atendidas;

    // Buscar por nombre o correo
    const busqueda = textoBusqueda.trim().toLowerCase();

    const resultados = solicitudes
        .map(function(solicitud, indiceOriginal) {
            return {
                solicitud: solicitud,
                indiceOriginal: indiceOriginal
            };
        })
        .filter(function(elemento) {
            const nombre =
                (elemento.solicitud.nombre || "").toLowerCase();

            const correo =
                (elemento.solicitud.correo || "").toLowerCase();

            return nombre.includes(busqueda) ||
                   correo.includes(busqueda);
        });

    // Mostrar mensaje si no hay resultados
    if (resultados.length === 0) {
        lista.textContent = busqueda
            ? "No se encontraron solicitudes con ese nombre o correo."
            : "Todavía no hay solicitudes registradas.";
        return;
    }

    // Crear una tarjeta por cada resultado
    resultados.forEach(function(elemento) {
        const solicitud = elemento.solicitud;
        const indice = elemento.indiceOriginal;

        const tarjeta = document.createElement("div");
        const titulo = document.createElement("h4");
        const detalle = document.createElement("p");
        const estado = document.createElement("p");
        const botonEstado = document.createElement("button");
        const botonEliminar = document.createElement("button");

        titulo.textContent = "Solicitud #" + (indice + 1);

        detalle.textContent =
            "Cliente: " + solicitud.nombre +
            " | Correo: " + solicitud.correo +
            " | Servicio: " + solicitud.servicio +
            " | Problema: " + solicitud.mensaje;

        estado.textContent = "Estado: " + solicitud.estado;

        botonEstado.type = "button";
        botonEstado.textContent =
            solicitud.estado === "Pendiente"
                ? "Marcar como atendida"
                : "Volver a pendiente";

        botonEstado.addEventListener("click", function() {
            const estadoAnterior = solicitud.estado;

            solicitud.estado =
                estadoAnterior === "Pendiente"
                    ? "Atendida"
                    : "Pendiente";

            if (guardarSolicitudes()) {
                mostrarSolicitudes();
            } else {
                solicitud.estado = estadoAnterior;
            }
        });

        botonEliminar.type = "button";
        botonEliminar.textContent = "Eliminar";

        botonEliminar.addEventListener("click", function() {
            const confirmar = confirm(
                "¿Seguro que deseas eliminar esta solicitud?"
            );

            if (!confirmar) return;

            const eliminada = solicitudes.splice(indice, 1)[0];

            if (guardarSolicitudes()) {
                mostrarSolicitudes();
            } else {
                solicitudes.splice(indice, 0, eliminada);
            }
        });

        tarjeta.append(
            titulo,
            detalle,
            estado,
            botonEstado,
            botonEliminar
        );

        lista.appendChild(tarjeta);
    });
}

// Detectar lo que se escribe en el buscador
if (buscador) {
    buscador.addEventListener("input", function() {
        textoBusqueda = buscador.value;
        mostrarSolicitudes();
    });
}

// Registrar solicitudes nuevas
if (formulario) {
    formulario.addEventListener("submit", function(event) {
        event.preventDefault();

        const solicitud = {
            nombre: document.querySelector("#nombre").value.trim(),
            correo: document.querySelector("#correo").value.trim(),
            servicio: document.querySelector("#servicio").value,
            mensaje: document.querySelector("#mensaje").value.trim(),
            estado: "Pendiente"
        };

        solicitudes.push(solicitud);

        if (!guardarSolicitudes()) {
            solicitudes.pop();
            return;
        }

        // Limpiar la búsqueda para mostrar la nueva solicitud
        textoBusqueda = "";
        if (buscador) buscador.value = "";

        mostrarSolicitudes();

        alert(
            "¡Gracias, " + solicitud.nombre + "!\n\n" +
            "Tu solicitud quedó registrada correctamente.\n" +
            "Estado: Pendiente."
        );

        formulario.reset();
    });
}

// Mostrar las solicitudes al abrir la página
mostrarSolicitudes();
