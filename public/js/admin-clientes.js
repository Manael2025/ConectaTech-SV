const tabla = document.getElementById('tabla-clientes');
const buscar = document.getElementById('buscar');
const conteo = document.getElementById('conteo');

let clientes = [];

function dibujar() {
  const texto = buscar.value.trim().toLowerCase();
  const visibles = clientes.filter(c =>
    !texto || c.nombre.toLowerCase().includes(texto) || c.correo.toLowerCase().includes(texto)
  );

  conteo.textContent = visibles.length + ' cliente(s)';

  if (visibles.length === 0) {
    tabla.innerHTML = '<p class="vacio">No hay clientes que coincidan.</p>';
    return;
  }

  tabla.innerHTML = `
    <table class="tabla">
      <thead>
        <tr><th>Cliente</th><th>Teléfono</th><th>Registro</th><th>Pedidos</th><th>Total comprado</th><th>Último pedido</th></tr>
      </thead>
      <tbody>
        ${visibles.map(c => `
          <tr>
            <td><strong>${esc(c.nombre)}</strong><span class="sub">${esc(c.correo)}</span></td>
            <td>${esc(c.telefono || '—')}</td>
            <td>${esc(fechaLocal(c.creado_en))}</td>
            <td>${c.pedidos}</td>
            <td><strong>${dinero(c.total_comprado)}</strong></td>
            <td>${c.ultimo_pedido ? esc(fechaLocal(c.ultimo_pedido)) : '—'}</td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

async function cargar() {
  try {
    clientes = await pedirApi('/api/admin/clientes');
    dibujar();
  } catch (error) {
    tabla.innerHTML = '<p class="vacio">No se pudieron cargar los clientes.</p>';
  }
}

buscar.addEventListener('input', dibujar);
cargar();