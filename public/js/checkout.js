const form = document.getElementById('form-checkout');
const mensaje = document.getElementById('mensaje');
const resumen = document.getElementById('resumen');
const contenido = document.getElementById('contenido');
const bloqueDireccion = document.getElementById('bloque-direccion');
const selDepartamento = document.getElementById('departamento');

let items = [];
let cuponAplicado = '';

function tipoEntrega() {
  return form.tipo_entrega.value;
}

function mostrar(texto, tipo) {
  mensaje.className = 'mensaje ' + tipo;
  mensaje.textContent = texto;
}

function limpiarMensaje() {
  mensaje.className = '';
  mensaje.textContent = '';
}

function textoEnvio(t) {
  if (tipoEntrega() === 'retiro') return 'Retiro (gratis)';
  if (t.envioPendiente) return 'Elige departamento';
  return t.envio === 0 ? 'Gratis' : dinero(t.envio);
}

function dibujarResumen(t) {
  resumen.innerHTML = `
    <h3>Resumen del pedido</h3>
    ${t.lineas.map(l => `
      <p><span>${esc(l.nombre)} x${l.cantidad}</span><span>${dinero(l.subtotal)}</span></p>`).join('')}
    <p><span>Subtotal</span><span>${dinero(t.subtotal)}</span></p>
    ${t.descuento > 0
      ? `<p><span>Descuento (${esc(t.cupon)})</span><span>-${dinero(t.descuento)}</span></p>`
      : ''}
    <p><span>Envío</span><span>${textoEnvio(t)}</span></p>
    <p class="resumen-total"><span>Total</span><span>${dinero(t.total)}</span></p>`;
}

// Pide al servidor el resumen con los precios reales
function pedirCalculo(cupon) {
  return enviarApi('/api/pedidos/calcular', {
    items: items,
    tipo_entrega: tipoEntrega(),
    departamento: selDepartamento.value,
    cupon: cupon
  });
}

async function recalcular() {
  try {
    dibujarResumen(await pedirCalculo(cuponAplicado));
  } catch (error) {
    mostrar(error.message, 'error');
  }
}

async function iniciar() {
  try {
    const { usuario } = await pedirApi('/api/auth/yo');
    if (!usuario) {
      location.href = '/login.html?volver=/checkout.html';
      return;
    }

    items = leerCarrito();
    if (items.length === 0) {
      location.href = '/carrito.html';
      return;
    }

    // Datos de la cuenta como punto de partida
    form.nombre.value = usuario.nombre;
    form.correo.value = usuario.correo;
    form.telefono.value = usuario.telefono || '';

    const opciones = await pedirApi('/api/pedidos/opciones');
    selDepartamento.innerHTML =
      '<option value="">Selecciona un departamento</option>' +
      opciones.departamentos.map(d =>
        `<option value="${esc(d.nombre)}">${esc(d.nombre)} (${dinero(d.costo)})</option>`).join('');

    contenido.hidden = false;
    await recalcular();
  } catch (error) {
    mostrar('No se pudo cargar el pago. Intenta de nuevo.', 'error');
  }
}

// Cambiar entrega: mostrar u ocultar la dirección
form.querySelectorAll('input[name="tipo_entrega"]').forEach(radio => {
  radio.addEventListener('change', () => {
    bloqueDireccion.hidden = tipoEntrega() === 'retiro';
    limpiarMensaje();
    recalcular();
  });
});

selDepartamento.addEventListener('change', () => {
  limpiarMensaje();
  recalcular();
});

// Aplicar cupón
document.getElementById('aplicar-cupon').addEventListener('click', async () => {
  const codigo = document.getElementById('cupon').value.trim();
  limpiarMensaje();

  if (!codigo) {
    cuponAplicado = '';
    return recalcular();
  }

  try {
    const t = await pedirCalculo(codigo);
    cuponAplicado = t.cupon;
    dibujarResumen(t);
    mostrar('Cupón aplicado: ' + t.cupon, 'ok');
  } catch (error) {
    cuponAplicado = '';
    await recalcular();
    mostrar(error.message, 'error');
  }
});

// Confirmar pedido
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  limpiarMensaje();

  const boton = form.querySelector('button[type="submit"]');
  boton.disabled = true;

  try {
    const respuesta = await enviarApi('/api/pedidos', {
      items: items,
      nombre: form.nombre.value,
      correo: form.correo.value,
      telefono: form.telefono.value,
      tipo_entrega: tipoEntrega(),
      departamento: selDepartamento.value,
      municipio: form.municipio.value,
      direccion: form.direccion.value,
      notas: form.notas.value,
      metodo_pago: form.metodo_pago.value,
      cupon: cuponAplicado
    });

    guardarCarrito([]); // el carrito se vacía al confirmar
    location.href = '/confirmacion.html?id=' + respuesta.pedido_id + '&nuevo=1';
  } catch (error) {
    mostrar(error.message, 'error');
    boton.disabled = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

iniciar();