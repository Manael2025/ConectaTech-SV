const contenedor = document.getElementById('pedido');
const params = new URLSearchParams(location.search);
const id = params.get('id');
const esNuevo = params.get('nuevo') === '1';

function entrega(p) {
  if (p.tipo_entrega === 'retiro') {
    return 'Retiro en punto acordado en San Miguel (te contactaremos para coordinar)';
  }
  return `${p.departamento}, ${p.municipio}. ${p.direccion}`;
}

async function cargar() {
  try {
    const p = await pedirApi('/api/pedidos/' + encodeURIComponent(id));

    contenedor.innerHTML = `
      ${esNuevo
        ? `<div class="exito">
             <h1>¡Gracias por tu compra!</h1>
             <p>Recibimos tu pedido <strong>${numeroPedido(p.id)}</strong>.
                Te contactaremos al ${esc(p.telefono)} para coordinar la entrega.</p>
           </div>`
        : `<h1 style="margin:30px 0 18px">Pedido ${numeroPedido(p.id)}</h1>`}

      <div class="panel">
        <h3>Datos del pedido</h3>
        <p><strong>Estado:</strong> <span class="estado estado-${esc(p.estado)}">${esc(etiquetaEstado(p.estado))}</span></p>
        <p><strong>Fecha:</strong> ${esc(fechaLocal(p.creado_en))}</p>
        <p><strong>Cliente:</strong> ${esc(p.nombre_cliente)} (${esc(p.correo)})</p>
        <p><strong>Entrega:</strong> ${esc(entrega(p))}</p>
        <p><strong>Pago:</strong> ${esc(ETIQUETAS_PAGO[p.metodo_pago] || p.metodo_pago)}</p>
        ${p.notas ? `<p><strong>Notas:</strong> ${esc(p.notas)}</p>` : ''}
      </div>

      <div class="panel">
        <h3>Productos</h3>
        <div class="tabla-caja">
          <table class="tabla">
            <thead><tr><th>Producto</th><th>Precio</th><th>Cant.</th><th>Subtotal</th></tr></thead>
            <tbody>
              ${p.detalle.map(d => `
                <tr>
                  <td>${esc(d.nombre_producto)}</td>
                  <td>${dinero(d.precio_unitario)}</td>
                  <td>${d.cantidad}</td>
                  <td>${dinero(d.subtotal)}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
        <p style="margin-top:14px"><strong>Subtotal:</strong> ${dinero(p.subtotal)}</p>
        ${p.descuento > 0 ? `<p><strong>Descuento:</strong> -${dinero(p.descuento)}</p>` : ''}
        <p><strong>Envío:</strong> ${p.envio === 0 ? 'Gratis' : dinero(p.envio)}</p>
        <p style="font-size:1.2rem"><strong>Total: ${dinero(p.total)}</strong></p>
      </div>

      ${p.metodo_pago === 'transferencia' ? `
      <div class="panel">
        <h3>Datos para tu transferencia</h3>
        <p>Transfiere <strong>${dinero(p.total)}</strong> e indica el número de pedido
           <strong>${numeroPedido(p.id)}</strong> como referencia.</p>
        <p><strong>Banco:</strong> [NOMBRE DEL BANCO]</p>
        <p><strong>Cuenta:</strong> [NÚMERO DE CUENTA]</p>
        <p><strong>A nombre de:</strong> ConectaTech SV</p>
      </div>` : ''}

      <p style="margin:20px 0">
        <a href="/productos.html" class="btn btn-prin">Seguir comprando</a>
        <a href="/mi-cuenta.html" class="btn btn-sec" style="width:auto;margin-left:8px">Mis pedidos</a>
      </p>`;
  } catch (error) {
    if (error.message === 'Error 401') {
      location.href = '/login.html?volver=' + encodeURIComponent(location.pathname + location.search);
      return;
    }
    contenedor.innerHTML =
      '<p class="vacio">Pedido no encontrado. <a href="/mi-cuenta.html">Ir a mi cuenta</a></p>';
  }
}

cargar();