const cuenta = document.getElementById('cuenta');

function tablaPedidos(pedidos) {
  if (pedidos.length === 0) {
    return '<p class="vacio" style="padding:20px 0">Aún no has hecho pedidos. <a href="/productos.html">Ver productos</a></p>';
  }
  return `
    <div class="tabla-caja">
      <table class="tabla">
        <thead><tr><th>Pedido</th><th>Fecha</th><th>Total</th><th>Estado</th><th></th></tr></thead>
        <tbody>
          ${pedidos.map(p => `
            <tr>
              <td>${numeroPedido(p.id)}</td>
              <td>${esc(fechaLocal(p.creado_en))}</td>
              <td>${dinero(p.total)}</td>
              <td><span class="estado estado-${esc(p.estado)}">${esc(etiquetaEstado(p.estado))}</span></td>
              <td><a href="/confirmacion.html?id=${p.id}">Ver</a></td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

async function cargarCuenta() {
  try {
    const { usuario } = await pedirApi('/api/auth/yo');

    // Sin sesión: se manda al inicio de sesión
    if (!usuario) {
      location.href = '/login.html?volver=/mi-cuenta.html';
      return;
    }

    let pedidos = [];
    try {
      pedidos = await pedirApi('/api/pedidos');
    } catch (error) {
      // si falla, se muestra la lista vacía
    }

    cuenta.innerHTML = `
      <div class="panel">
        <h3>Mis datos</h3>
        <p><strong>Nombre:</strong> ${esc(usuario.nombre)}</p>
        <p><strong>Correo:</strong> ${esc(usuario.correo)}</p>
        <p><strong>Teléfono:</strong> ${esc(usuario.telefono || 'No registrado')}</p>
        <p><strong>Cliente desde:</strong> ${esc(fechaLocal(usuario.creado_en))}</p>
        <button class="btn btn-sec" id="salir" style="width:auto;margin-top:14px">Cerrar sesión</button>
      </div>

      <div class="panel" style="max-width:900px">
        <h3>Mis pedidos</h3>
        ${tablaPedidos(pedidos)}
      </div>`;

    document.getElementById('salir').addEventListener('click', async () => {
      await enviarApi('/api/auth/logout');
      location.href = '/';
    });
  } catch (error) {
    cuenta.innerHTML = '<p class="vacio">No se pudo cargar tu cuenta.</p>';
  }
}

cargarCuenta();