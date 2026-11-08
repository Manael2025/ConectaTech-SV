const tabla = document.getElementById('tabla-pedidos');
const buscar = document.getElementById('buscar');
const filtroEstado = document.getElementById('filtro-estado');
const mensaje = document.getElementById('mensaje');
const dialogo = document.getElementById('dialogo');
const contenidoDialogo = document.getElementById('contenido-dialogo');

let pedidoAbierto = null;

function mostrar(texto, tipo) {
  mensaje.className = 'mensaje ' + tipo;
  mensaje.textContent = texto;
}

function textoEntrega(p) {
  if (p.tipo_entrega === 'retiro') return 'Retiro';
  return 'Domicilio' + (p.departamento ? ' · ' + p.departamento : '');
}

function dibujarLista(pedidos) {
  if (pedidos.length === 0) {
    tabla.innerHTML = '<p class="vacio">No hay pedidos que coincidan.</p>';
    return;
  }

  tabla.innerHTML = `
    <table class="tabla">
      <thead>
        <tr><th>Pedido</th><th>Fecha</th><th>Cliente</th><th>Entrega</th><th>Pago</th><th>Total</th><th>Estado</th><th></th></tr>
      </thead>
      <tbody>
        ${pedidos.map(p => `
          <tr>
            <td><strong>${numeroPedido(p.id)}</strong></td>
            <td>${esc(fechaLocal(p.creado_en))}</td>
            <td>${esc(p.nombre_cliente)}<span class="sub">${esc(p.correo)}</span></td>
            <td>${esc(textoEntrega(p))}</td>
            <td>${esc(ETIQUETAS_PAGO[p.metodo_pago] || p.metodo_pago)}</td>
            <td>${dinero(p.total)}</td>
            <td><span class="estado estado-${esc(p.estado)}">${esc(etiquetaEstado(p.estado))}</span></td>
            <td><button class="enlace" data-id="${p.id}">Ver</button></td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

async function cargar() {
  const q = new URLSearchParams();
  if (buscar.value.trim()) q.set('q', buscar.value.trim());
  if (filtroEstado.value) q.set('estado', filtroEstado.value);

  try {
    dibujarLista(await pedirApi('/api/admin/pedidos?' + q.toString()));
  } catch (error) {
    tabla.innerHTML = '<p class="vacio">No se pudieron cargar los pedidos.</p>';
  }
}

function botonEstado(estado) {
  if (estado === 'cancelado') {
    return '<button class="btn btn-peligro" data-estado="cancelado">Cancelar pedido</button>';
  }
  return `<button class="btn btn-prin" data-estado="${esc(estado)}">Marcar como ${esc(etiquetaEstado(estado))}</button>`;
}

function dibujarDetalle() {
  const p = pedidoAbierto;
  const entrega = p.tipo_entrega === 'retiro'
    ? 'Retiro en punto acordado'
    : `${p.departamento}, ${p.municipio}. ${p.direccion}`;

  contenidoDialogo.innerHTML = `
    <div class="cabecera-dialogo">
      <h2>Pedido ${numeroPedido(p.id)}</h2>
      <span class="estado estado-${esc(p.estado)}">${esc(etiquetaEstado(p.estado))}</span>
    </div>
    <div id="aviso-dialogo"></div>

    <div class="detalle-datos">
      <p><strong>Fecha:</strong> ${esc(fechaLocal(p.creado_en))}</p>
      <p><strong>Cliente:</strong> ${esc(p.nombre_cliente)}</p>
      <p><strong>Correo:</strong> ${esc(p.correo)}</p>
      <p><strong>Teléfono:</strong> ${esc(p.telefono)}</p>
      <p><strong>Entrega:</strong> ${esc(entrega)}</p>
      <p><strong>Pago:</strong> ${esc(ETIQUETAS_PAGO[p.metodo_pago] || p.metodo_pago)}</p>
      ${p.notas ? `<p><strong>Notas:</strong> ${esc(p.notas)}</p>` : ''}

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
      <p style="margin-top:12px"><strong>Subtotal:</strong> ${dinero(p.subtotal)}</p>
      ${p.descuento > 0 ? `<p><strong>Descuento:</strong> -${dinero(p.descuento)}</p>` : ''}
      <p><strong>Envío:</strong> ${p.envio === 0 ? 'Gratis' : dinero(p.envio)}</p>
      <p style="font-size:1.15rem"><strong>Total: ${dinero(p.total)}</strong></p>

      <h3>Cambiar estado</h3>
      ${p.estados_siguientes.length
        ? `<div class="acciones-estado">${p.estados_siguientes.map(botonEstado).join('')}</div>`
        : '<p class="ayuda">Este pedido ya no admite cambios.</p>'}
    </div>`;
}

function avisarDialogo(texto, tipo) {
  const aviso = document.getElementById('aviso-dialogo');
  if (!aviso) return;
  aviso.className = 'mensaje ' + tipo;
  aviso.textContent = texto;
}

async function abrirDetalle(id) {
  try {
    pedidoAbierto = await pedirApi('/api/admin/pedidos/' + id);
    dibujarDetalle();
    dialogo.showModal();
  } catch (error) {
    mostrar('No se pudo abrir el pedido', 'error');
  }
}

// Clic en "Ver" de la tabla
tabla.addEventListener('click', (e) => {
  const boton = e.target.closest('[data-id]');
  if (boton) abrirDetalle(boton.dataset.id);
});

// Clic en los botones de cambio de estado
contenidoDialogo.addEventListener('click', async (e) => {
  const boton = e.target.closest('[data-estado]');
  if (!boton || !pedidoAbierto) return;

  const nuevo = boton.dataset.estado;
  if (nuevo === 'cancelado' &&
      !confirm('¿Cancelar el pedido ' + numeroPedido(pedidoAbierto.id) + '? Las unidades vuelven al inventario.')) {
    return;
  }

  boton.disabled = true;
  try {
    pedidoAbierto = await llamarApi('PATCH', '/api/admin/pedidos/' + pedidoAbierto.id + '/estado', { estado: nuevo });
    dibujarDetalle();
    avisarDialogo('Estado actualizado: ' + etiquetaEstado(nuevo), 'ok');
    cargar();
  } catch (error) {
    avisarDialogo(error.message, 'error');
    boton.disabled = false;
  }
});

document.getElementById('cerrar').addEventListener('click', () => dialogo.close());
filtroEstado.addEventListener('change', cargar);

// Espera un momento después de escribir para no pedir datos en cada letra
let espera;
buscar.addEventListener('input', () => {
  clearTimeout(espera);
  espera = setTimeout(cargar, 300);
});

cargar();