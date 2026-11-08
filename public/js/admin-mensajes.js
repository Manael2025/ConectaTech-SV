const tabla = document.getElementById('tabla-mensajes');
const mensaje = document.getElementById('mensaje');
const dialogo = document.getElementById('dialogo');
const contenidoDialogo = document.getElementById('contenido-dialogo');

let mensajes = [];
let abierto = null;

function mostrar(texto, tipo) {
  mensaje.className = 'mensaje ' + tipo;
  mensaje.textContent = texto;
}

function dibujar() {
  if (mensajes.length === 0) {
    tabla.innerHTML = '<p class="vacio">Todavía no hay mensajes.</p>';
    return;
  }

  tabla.innerHTML = `
    <table class="tabla">
      <thead><tr><th>Fecha</th><th>De</th><th>Asunto</th><th>Estado</th><th></th></tr></thead>
      <tbody>
        ${mensajes.map(m => `
          <tr class="${m.leido ? '' : 'fila-nueva'}">
            <td>${esc(fechaLocal(m.creado_en))}</td>
            <td>${esc(m.nombre)}<span class="sub">${esc(m.correo)}</span></td>
            <td>${esc(m.asunto)}</td>
            <td>${m.leido
              ? '<span class="estado">Leído</span>'
              : '<span class="estado estado-pendiente">Nuevo</span>'}</td>
            <td><button class="enlace" data-id="${m.id}">Ver</button></td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

function dibujarDetalle() {
  const m = abierto;
  const asuntoCorreo = encodeURIComponent('Re: ' + m.asunto);

  contenidoDialogo.innerHTML = `
    <div class="cabecera-dialogo">
      <h2>${esc(m.asunto)}</h2>
      <span class="estado ${m.leido ? '' : 'estado-pendiente'}">${m.leido ? 'Leído' : 'Nuevo'}</span>
    </div>
    <div id="aviso-dialogo"></div>
    <div class="detalle-datos">
      <p><strong>De:</strong> ${esc(m.nombre)} (${esc(m.correo)})</p>
      ${m.telefono ? `<p><strong>Teléfono:</strong> ${esc(m.telefono)}</p>` : ''}
      <p><strong>Fecha:</strong> ${esc(fechaLocal(m.creado_en))}</p>
      <div class="mensaje-texto">${esc(m.mensaje)}</div>
      <div class="acciones-estado" style="margin-top:16px">
        <a class="btn btn-prin" href="mailto:${esc(m.correo)}?subject=${asuntoCorreo}">Responder por correo</a>
        <button class="btn btn-sec" data-accion="alternar" style="width:auto">
          ${m.leido ? 'Marcar como no leído' : 'Marcar como leído'}
        </button>
        <button class="btn btn-peligro" data-accion="eliminar">Eliminar</button>
      </div>
    </div>`;
}

async function cargar() {
  try {
    mensajes = await pedirApi('/api/admin/mensajes');
    dibujar();
  } catch (error) {
    tabla.innerHTML = '<p class="vacio">No se pudieron cargar los mensajes.</p>';
  }
}

// Abrir un mensaje lo marca como leído
tabla.addEventListener('click', async (e) => {
  const boton = e.target.closest('[data-id]');
  if (!boton) return;

  abierto = mensajes.find(m => m.id === Number(boton.dataset.id));
  if (!abierto) return;

  try {
    if (!abierto.leido) {
      await llamarApi('PATCH', '/api/admin/mensajes/' + abierto.id + '/leido', { leido: true });
      abierto.leido = 1;
      dibujar();
    }
    dibujarDetalle();
    dialogo.showModal();
  } catch (error) {
    mostrar(error.message, 'error');
  }
});

contenidoDialogo.addEventListener('click', async (e) => {
  const boton = e.target.closest('[data-accion]');
  if (!boton || !abierto) return;

  try {
    if (boton.dataset.accion === 'alternar') {
      const nuevo = !abierto.leido;
      await llamarApi('PATCH', '/api/admin/mensajes/' + abierto.id + '/leido', { leido: nuevo });
      abierto.leido = nuevo ? 1 : 0;
      dibujarDetalle();
      dibujar();
    } else if (boton.dataset.accion === 'eliminar') {
      if (!confirm('¿Eliminar este mensaje? Esta acción no se puede deshacer.')) return;
      await llamarApi('DELETE', '/api/admin/mensajes/' + abierto.id);
      dialogo.close();
      mostrar('Mensaje eliminado', 'ok');
      await cargar();
    }
  } catch (error) {
    const aviso = document.getElementById('aviso-dialogo');
    if (aviso) {
      aviso.className = 'mensaje error';
      aviso.textContent = error.message;
    }
  }
});

document.getElementById('cerrar').addEventListener('click', () => dialogo.close());

cargar();