
const SUPABASE_URL = "https://obdvsjkjserhwdfbpnqy.supabase.co";
const SUPABASE_KEY = "sb_publishable__SqtLHy4J8TuwEgRb54Obg_0k0olD1r";
const ADMIN_EMAIL = "dabliudeath@gmail.com";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const formulario = document.querySelector("#formulario-solicitud");
const formularioLogin = document.querySelector("#formulario-login");
const panel = document.querySelector("#panel-administrativo");
const mensajeFormulario = document.querySelector("#mensaje-formulario");
const mensajeLogin = document.querySelector("#mensaje-login");
const lista = document.querySelector("#lista-solicitudes");
const buscador = document.querySelector("#buscar-solicitud");
const botonCerrar = document.querySelector("#cerrar-sesion");

let solicitudes = [];
let textoBusqueda = "";

function mostrarMensaje(elemento, texto) {
    if (elemento) elemento.textContent = texto;
}

// Registrar solicitudes en Supabase
if (formulario) {
    formulario.addEventListener("submit", async function(event) {
        event.preventDefault();

        const solicitud = {
            nombre: document.querySelector("#nombre").value.trim(),
            correo: document.querySelector("#correo").value.trim(),
            servicio: document.querySelector("#servicio").value,
            mensaje: document.querySelector("#mensaje").value.trim(),
            estado: "Pendiente"
        };

        mostrarMensaje(mensajeFormulario, "Enviando solicitud...");

        const { error } = await supabaseClient
            .from("solicitudes")
            .insert([solicitud]);

        if (error) {
            console.error("Error al guardar:", error);
            mostrarMensaje(
                mensajeFormulario,
                "No se pudo enviar la solicitud. Intenta nuevamente."
            );
            return;
        }

        formulario.reset();
        mostrarMensaje(
            mensajeFormulario,
            "¡Solicitud enviada correctamente! Pronto nos comunicaremos contigo."
        );
    });
}

// Mostrar solicitudes en el panel administrativo
function mostrarSolicitudes() {
    if (!lista) return;

    lista.replaceChildren();

    const busqueda = textoBusqueda.trim().toLowerCase();

    const resultados = solicitudes.filter(function(s) {
        return (s.nombre || "").toLowerCase().includes(busqueda) ||
               (s.correo || "").toLowerCase().includes(busqueda);
    });

    const total = solicitudes.length;
    const pendientes = solicitudes.filter(s => s.estado === "Pendiente").length;
    const atendidas = solicitudes.filter(s => s.estado === "Atendida").length;

    document.querySelector("#total-solicitudes").textContent = total;
    document.querySelector("#total-pendientes").textContent = pendientes;
    document.querySelector("#total-atendidas").textContent = atendidas;

    if (resultados.length === 0) {
        lista.textContent = busqueda
            ? "No se encontraron solicitudes con esa búsqueda."
            : "Todavía no hay solicitudes registradas.";
        return;
    }

    resultados.forEach(function(solicitud) {
        const tarjeta = document.createElement("article");
        const titulo = document.createElement("h4");
        const detalle = document.createElement("p");
        const estado = document.createElement("p");
        const botonEstado = document.createElement("button");
        const botonEliminar = document.createElement("button");

        titulo.textContent = "Solicitud #" + solicitud.id;
        detalle.textContent =
            "Cliente: " + solicitud.nombre +
            " | Correo: " + solicitud.correo +
            " | Servicio: " + solicitud.servicio +
            " | Mensaje: " + solicitud.mensaje;

        estado.textContent = "Estado: " + solicitud.estado;

        botonEstado.type = "button";
        botonEstado.textContent = solicitud.estado === "Pendiente"
            ? "Marcar como atendida"
            : "Volver a pendiente";

        botonEstado.addEventListener("click", async function() {
            const nuevoEstado = solicitud.estado === "Pendiente"
                ? "Atendida"
                : "Pendiente";

            const { error } = await supabaseClient
                .from("solicitudes")
                .update({ estado: nuevoEstado })
                .eq("id", solicitud.id);

            if (error) {
                console.error(error);
                alert("No se pudo actualizar el estado.");
                return;
            }

            await cargarSolicitudes();
        });

        botonEliminar.type = "button";
        botonEliminar.textContent = "Eliminar";

        botonEliminar.addEventListener("click", async function() {
            if (!confirm("¿Seguro que deseas eliminar esta solicitud?")) return;

            const { error } = await supabaseClient
                .from("solicitudes")
                .delete()
                .eq("id", solicitud.id);

            if (error) {
                console.error(error);
                alert("No se pudo eliminar la solicitud.");
                return;
            }

            await cargarSolicitudes();
        });

        tarjeta.append(titulo, detalle, estado, botonEstado, botonEliminar);
        lista.appendChild(tarjeta);
    });
}

async function cargarSolicitudes() {
    if (!panel || panel.hidden) return;

    const { data, error } = await supabaseClient
        .from("solicitudes")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error al consultar solicitudes:", error);
        mostrarMensaje(mensajeLogin, "No se pudieron cargar las solicitudes. Revisa los permisos de Supabase.");
        return;
    }

    solicitudes = data || [];
    mostrarSolicitudes();
}

// Inicio de sesión administrativo
if (formularioLogin) {
    formularioLogin.addEventListener("submit", async function(event) {
        event.preventDefault();

        const correo = document.querySelector("#correo-admin").value.trim();
        const clave = document.querySelector("#clave-admin").value;

        mostrarMensaje(mensajeLogin, "Verificando acceso...");

        if (correo.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
            mostrarMensaje(mensajeLogin, "Este correo no está autorizado como administrador.");
            return;
        }

        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: correo,
            password: clave
        });

        if (error) {
            console.error("Error de inicio de sesión:", error);
            mostrarMensaje(mensajeLogin, "No se pudo iniciar sesión. Verifica el correo y la contraseña.");
            return;
        }

        if (!data.user || data.user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
            await supabaseClient.auth.signOut();
            mostrarMensaje(mensajeLogin, "La cuenta no está autorizada.");
            return;
        }

        formularioLogin.hidden = true;
        if (panel) panel.hidden = false;
        mostrarMensaje(mensajeLogin, "");
        await cargarSolicitudes();
    });
}

// Cerrar sesión
if (botonCerrar) {
    botonCerrar.addEventListener("click", async function() {
        await supabaseClient.auth.signOut();
        if (panel) panel.hidden = true;
        if (formularioLogin) formularioLogin.hidden = false;
        mostrarMensaje(mensajeLogin, "Sesión cerrada correctamente.");
    });
}

// Buscar solicitudes
if (buscador) {
    buscador.addEventListener("input", function() {
        textoBusqueda = buscador.value;
        mostrarSolicitudes();
    });
}

// Recuperar una sesión existente de forma segura
async function iniciarPagina() {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error) {
        console.error(error);
        return;
    }

    const usuario = data.session?.user;

    if (usuario && usuario.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        if (formularioLogin) formularioLogin.hidden = true;
        if (panel) panel.hidden = false;
        await cargarSolicitudes();
    } else {
        if (panel) panel.hidden = true;
        if (formularioLogin) formularioLogin.hidden = false;
    }
}

iniciarPagina();
