const tabla = document.getElementById('tabla-resenas');
const mensaje = document.getElementById('mensaje');

function mostrar(texto, tipo) {
  mensaje.className = 'mensaje ' + tipo;
  mensaje.textContent = texto;
}

function estrellas(valor) {
  return '★'.repeat(valor) + '☆'.repeat(5 - valor);
}

async function cargar() {
  try {
    const resenas = await pedirApi('/api/admin/resenas');

    if (resenas.length === 0) {
      tabla.innerHTML = '<p class="vacio">Todavía no hay reseñas.</p>';
      return;
    }

    tabla.innerHTML = `
      <table class="tabla">
        <thead><tr><th>Fecha</th><th>Producto</th><th>Cliente</th><th>Calificación</th><th>Comentario</th><th></th></tr></thead>
        <tbody>
          ${resenas.map(r => `
            <tr>
              <td>${esc(fechaLocal(r.creado_en))}</td>
              <td>${esc(r.producto)}</td>
              <td>${esc(r.autor)}<span class="sub">${esc(r.correo)}</span></td>
              <td><span class="estrellas">${estrellas(r.calificacion)}</span></td>
              <td>${esc(r.comentario || '—')}</td>
              <td><button class="enlace peligro" data-id="${r.id}">Eliminar</button></td>
            </tr>`).join('')}
        </tbody>
      </table>`;
  } catch (error) {
    tabla.innerHTML = '<p class="vacio">No se pudieron cargar las reseñas.</p>';
  }
}

tabla.addEventListener('click', async (e) => {
  const boton = e.target.closest('[data-id]');
  if (!boton) return;
  if (!confirm('¿Eliminar esta reseña? Esta acción no se puede deshacer.')) return;

  try {
    await llamarApi('DELETE', '/api/admin/resenas/' + boton.dataset.id);
    mostrar('Reseña eliminada', 'ok');
    await cargar();
  } catch (error) {
    mostrar(error.message, 'error');
  }
});

cargar();