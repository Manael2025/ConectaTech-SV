const form = document.getElementById('form-contacto');
const aviso = document.getElementById('aviso');
const datos = document.getElementById('datos-tienda');

function mostrar(texto, tipo) {
  aviso.className = 'mensaje ' + tipo;
  aviso.textContent = texto;
}

// Una fila de datos; si no hay valor, no se muestra
function dato(titulo, valor) {
  return valor ? `<div class="dato"><strong>${esc(titulo)}</strong>${valor}</div>` : '';
}

datos.innerHTML =
  '<h3>Datos de la tienda</h3>' +
  dato('Ubicación', esc(TIENDA.ciudad)) +
  dato('Horario de atención', esc(TIENDA.horario)) +
  dato('Correo', TIENDA.correo
    ? `<a href="mailto:${esc(TIENDA.correo)}">${esc(TIENDA.correo)}</a>` : '') +
  dato('Teléfono', esc(TIENDA.telefono)) +
  dato('WhatsApp', TIENDA.whatsapp
    ? `<a href="https://wa.me/${encodeURIComponent(TIENDA.whatsapp)}" target="_blank" rel="noopener">Escríbenos por WhatsApp</a>` : '') +
  dato('Envíos', 'A todo El Salvador');

// Si hay sesión iniciada, se rellenan los datos del cliente
(async () => {
  try {
    const { usuario } = await pedirApi('/api/auth/yo');
    if (usuario) {
      form.nombre.value = usuario.nombre;
      form.correo.value = usuario.correo;
      form.telefono.value = usuario.telefono || '';
    }
  } catch (error) {
    // el formulario se llena a mano
  }
})();

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  aviso.className = '';
  aviso.textContent = '';

  const boton = form.querySelector('button[type="submit"]');
  boton.disabled = true;

  try {
    await enviarApi('/api/contacto', {
      nombre: form.nombre.value,
      correo: form.correo.value,
      telefono: form.telefono.value,
      asunto: form.asunto.value,
      mensaje: form.mensaje.value,
      sitio_web: form.sitio_web.value
    });
    mostrar('¡Gracias! Recibimos tu mensaje y te responderemos pronto.', 'ok');
    form.asunto.value = '';
    form.mensaje.value = '';
  } catch (error) {
    mostrar(error.message, 'error');
  } finally {
    boton.disabled = false;
  }
});