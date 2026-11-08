const caja = document.getElementById('dashboard');

// 2026-10-09 -> 09/10
function fechaCorta(dia) {
  return dia.slice(8, 10) + '/' + dia.slice(5, 7);
}

// Dibuja barras horizontales. "etiqueta" es una función que devuelve el texto de cada fila.
function barras(filas, etiqueta, valor, formato) {
  if (filas.length === 0) {
    return '<p class="vacio" style="padding:14px 0">Aún no hay ventas registradas.</p>';
  }
  const max = Math.max(1, ...filas.map(f => f[valor]));
  return filas.map(f => `
    <div class="barra-fila">
      <span class="barra-etiqueta" title="${esc(etiqueta(f))}">${esc(etiqueta(f))}</span>
      <div class="barra-caja">
        <div class="barra" style="width:${(f[valor] / max * 100).toFixed(1)}%"></div>
      </div>
      <span class="barra-valor">${formato(f[valor])}</span>
    </div>`).join('');
}

function tablaRecientes(pedidos) {
  if (pedidos.length === 0) {
    return '<p class="vacio" style="padding:14px 0">Todavía no hay pedidos.</p>';
  }
  return `
    <div class="tabla-caja">
      <table class="tabla">
        <thead><tr><th>Pedido</th><th>Cliente</th><th>Total</th><th>Estado</th></tr></thead>
        <tbody>
          ${pedidos.map(p => `
            <tr>
              <td><a href="/confirmacion.html?id=${p.id}">${numeroPedido(p.id)}</a></td>
              <td>${esc(p.nombre_cliente)}</td>
              <td>${dinero(p.total)}</td>
              <td><span class="estado estado-${esc(p.estado)}">${esc(etiquetaEstado(p.estado))}</span></td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

function tablaStock(productos) {
  if (productos.length === 0) {
    return '<p class="vacio" style="padding:14px 0">Todo el inventario está en buen nivel.</p>';
  }
  return `
    <div class="tabla-caja">
      <table class="tabla">
        <thead><tr><th>Producto</th><th>Stock</th></tr></thead>
        <tbody>
          ${productos.map(p => `
            <tr>
              <td>${esc(p.nombre)}</td>
              <td><span class="estado ${p.stock === 0 ? 'estado-cancelado' : 'estado-pendiente'}">${p.stock}</span></td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

async function cargar() {
  try {
    const d = await pedirApi('/api/admin/dashboard');

    const cifras = [
      ['Ventas totales', dinero(d.ventas_total)],
      ['Pedidos', d.pedidos_total],
      ['Pedidos pendientes', d.pedidos_pendientes],
      ['Ticket promedio', dinero(d.ticket_promedio)],
      ['Clientes registrados', d.clientes],
      ['Mensajes sin leer', d.mensajes_sin_leer]
    ];

    caja.innerHTML = `
      <div class="kpis">
        ${cifras.map(([titulo, valor]) => `
          <div class="kpi"><span>${titulo}</span><strong>${valor}</strong></div>`).join('')}
      </div>

      <div class="admin-grid">
        <div class="admin-caja">
          <h3>Ventas de los últimos 7 días</h3>
          ${barras(d.ventas_por_dia, f => fechaCorta(f.dia), 'total', dinero)}
        </div>
        <div class="admin-caja">
          <h3>Pedidos por estado</h3>
          ${barras(d.pedidos_por_estado, f => etiquetaEstado(f.estado), 'cantidad', n => n)}
        </div>
      </div>

      <div class="admin-grid">
        <div class="admin-caja">
          <h3>Productos más vendidos</h3>
          ${barras(d.top_productos, f => f.nombre, 'unidades', n => n + ' u.')}
        </div>
        <div class="admin-caja">
          <h3>Ventas por categoría</h3>
          ${barras(d.ventas_por_categoria, f => f.categoria, 'total', dinero)}
        </div>
      </div>

      <div class="admin-grid">
        <div class="admin-caja">
          <h3>Pedidos recientes</h3>
          ${tablaRecientes(d.pedidos_recientes)}
        </div>
        <div class="admin-caja">
          <h3>Stock bajo (${d.umbral_stock_bajo} unidades o menos)</h3>
          ${tablaStock(d.stock_bajo)}
        </div>
      </div>`;
  } catch (error) {
    caja.innerHTML = '<p class="vacio">No se pudo cargar el dashboard.</p>';
  }
}

cargar();