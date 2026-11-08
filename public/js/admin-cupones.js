const tabla = document.getElementById('tabla-cupones');
const mensaje = document.getElementById('mensaje');
const formulario = document.getElementById('form-cupon');

let cupones = [];

function mostrar(texto, tipo) {
  mensaje.className = 'mensaje ' + tipo;
  mensaje.textContent = texto;
}

function dibujar() {
  if (cupones.length === 0) {
    tabla.innerHTML = '<p class="vacio">Todavía no hay cupones.</p>';
    return;
  }

  tabla.innerHTML = `
    <table class="tabla">
      <thead><tr><th>Código</th><th>Descuento</th><th>Estado</th><th></th></tr></thead>
      <tbody>
        ${cupones.map(c => `
          <tr class="${c.activo ? '' : 'fila-inactiva'}">
            <td><strong>${esc(c.codigo)}</strong></td>
            <td>${c.porcentaje}%</td>
            <td>${c.activo
              ? '<span class="estado estado-entregado">Activo</span>'
              : '<span class="estado">Inactivo</span>'}</td>
            <td class="acciones">
              <button class="enlace" data-accion="activar" data-id="${c.id}">${c.activo ? 'Desactivar' : 'Activar'}</button>
              <button class="enlace peligro" data-accion="eliminar" data-id="${c.id}">Eliminar</button>
            </td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

async function cargar() {
  try {
    cupones = await pedirApi('/api/admin/cupones');
    dibujar();
  } catch (error) {
    tabla.innerHTML = '<p class="vacio">No se pudieron cargar los cupones.</p>';
  }
}

tabla.addEventListener('click', async (e) => {
  const boton = e.target.closest('[data-accion]');
  if (!boton) return;

  const cupon = cupones.find(c => c.id === Number(boton.dataset.id));
  if (!cupon) return;

  try {
    if (boton.dataset.accion === 'activar') {
      await llamarApi('PATCH', '/api/admin/cupones/' + cupon.id + '/activo', { activo: !cupon.activo });
      mostrar(cupon.activo ? 'Cupón desactivado: ya no se puede usar' : 'Cupón activado', 'ok');
    } else {
      if (!confirm('¿Eliminar el cupón ' + cupon.codigo + '?')) return;
      await llamarApi('DELETE', '/api/admin/cupones/' + cupon.id);
      mostrar('Cupón eliminado', 'ok');
    }
    await cargar();
  } catch (error) {
    mostrar(error.message, 'error');
  }
});

formulario.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await llamarApi('POST', '/api/admin/cupones', {
      codigo: formulario.codigo.value,
      porcentaje: formulario.porcentaje.value
    });
    mostrar('Cupón creado', 'ok');
    formulario.reset();
    await cargar();
  } catch (error) {
    mostrar(error.message, 'error');
  }
});

cargar();