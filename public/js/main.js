// ---------- DATOS DE LA TIENDA ----------
// Cambia estos datos por los reales. Lo que dejes vacío no se muestra.
const TIENDA = {
  nombre: 'ConectaTech SV',
  eslogan: 'Tu tecnología, siempre conectada.',
  ciudad: 'San Miguel, El Salvador',
  correo: '',
  telefono: '',
  whatsapp: '',   // solo números con código de país, por ejemplo: 503XXXXXXXX
  horario: 'Lunes a viernes, de 8:00 a. m. a 5:00 p. m.'   // ejemplo, cámbialo
};

const IMG_FALLBACK = '/img/placeholder.svg';

// Formatea un número como dinero: 10 -> $10.00
function dinero(n) {
  return '$' + Number(n).toFixed(2);
}

// Evita que un texto se interprete como código HTML (seguridad)
function esc(texto) {
  return String(texto ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

// Pide datos a la API del servidor
async function pedirApi(url) {
  const respuesta = await fetch(url);
  if (!respuesta.ok) throw new Error('Error ' + respuesta.status);
  return respuesta.json();
}

// Dibuja una tarjeta de producto
function tarjetaProducto(p) {
  const oferta = p.en_oferta === 1 && p.precio_oferta != null;
  return `
    <article class="tarjeta">
      <a href="/producto.html?id=${p.id}" class="tarjeta-img">
        ${oferta ? '<span class="etiqueta">Oferta</span>' : ''}
        <img src="${esc(p.imagen)}" alt="${esc(p.nombre)}" loading="lazy"
             onerror="this.onerror=null;this.src='${IMG_FALLBACK}'">
      </a>
      <div class="tarjeta-info">
        <span class="tarjeta-cat">${esc(p.categoria)}</span>
        <h3><a href="/producto.html?id=${p.id}">${esc(p.nombre)}</a></h3>
        <div class="precio">
          <strong>${dinero(p.precio_final)}</strong>
          ${oferta ? `<s>${dinero(p.precio)}</s>` : ''}
        </div>
        <a class="btn btn-sec" href="/producto.html?id=${p.id}">Ver detalle</a>
      </div>
    </article>`;
}

// Inserta el menú y el pie de página en cada página
function cargarLayout() {
  const header = document.getElementById('header');
  const footer = document.getElementById('footer');

  if (header) {
    header.className = 'encabezado';
    header.innerHTML = `
      <div class="contenedor">
        <a href="/" class="logo">Conecta<span>Tech</span> SV</a>
        <nav class="menu">
          <a href="/">Inicio</a>
          <a href="/productos.html">Productos</a>
          <a href="/ofertas.html">Ofertas</a>
          <a href="/nosotros.html">Nosotros</a>
          <a href="/contacto.html">Contacto</a>
          <a href="/login.html" id="enlace-cuenta">Ingresar</a>
          <a href="/carrito.html">Carrito <span id="contador-carrito" class="contador" hidden>0</span></a>
        </nav>
      </div>`;
  }

  if (footer) {
    footer.className = 'pie';
    footer.innerHTML = `
      <div class="contenedor">
        <div>
          <strong>${esc(TIENDA.nombre)}</strong><br>
          ${esc(TIENDA.eslogan)}
        </div>
        <div>
          <strong>Ayuda</strong><br>
          <a href="/nosotros.html">Quiénes somos</a><br>
          <a href="/nosotros.html#envios">Envíos y pagos</a><br>
          <a href="/nosotros.html#devoluciones">Devoluciones</a><br>
          <a href="/contacto.html">Contacto</a>
        </div>
        <div>
          <strong>Contacto</strong><br>
          ${esc(TIENDA.ciudad)}<br>
          Envíos a todo el país
          ${TIENDA.horario ? '<br>' + esc(TIENDA.horario) : ''}
          ${TIENDA.correo ? '<br>' + esc(TIENDA.correo) : ''}
          ${TIENDA.telefono ? '<br>' + esc(TIENDA.telefono) : ''}
        </div>
        <small>© ${new Date().getFullYear()} ${esc(TIENDA.nombre)}. Proyecto académico.</small>
      </div>`;

    // Botón flotante de WhatsApp (solo si configuraste el número)
    if (TIENDA.whatsapp) {
      const wa = document.createElement('a');
      wa.className = 'whatsapp';
      wa.href = 'https://wa.me/' + encodeURIComponent(TIENDA.whatsapp) +
        '?text=' + encodeURIComponent('Hola, quiero información sobre sus productos.');
      wa.target = '_blank';
      wa.rel = 'noopener';
      wa.textContent = 'WhatsApp';
      wa.setAttribute('aria-label', 'Escríbenos por WhatsApp');
      document.body.appendChild(wa);
    }
  }

  // Muestra el número de productos del carrito y el nombre del usuario en el menú
  actualizarContador();
  actualizarCuenta();
}

document.addEventListener('DOMContentLoaded', cargarLayout);

// ---------- CARRITO ----------
const CLAVE_CARRITO = 'conectatech_carrito';

// Lee el carrito guardado: [{ id: 1, cantidad: 2 }, ...]
function leerCarrito() {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE_CARRITO));
    return Array.isArray(datos) ? datos : [];
  } catch (error) {
    return [];
  }
}

function guardarCarrito(carrito) {
  localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito));
  actualizarContador();
}

// Agrega un producto sin pasar del stock. Devuelve la cantidad que quedó en el carrito.
function agregarAlCarrito(id, cantidad, stock) {
  const carrito = leerCarrito();
  const item = carrito.find(i => i.id === id);
  const nueva = Math.min((item ? item.cantidad : 0) + cantidad, stock);

  if (item) {
    item.cantidad = nueva;
  } else {
    carrito.push({ id: id, cantidad: nueva });
  }
  guardarCarrito(carrito);
  return nueva;
}

function totalUnidades() {
  return leerCarrito().reduce((suma, i) => suma + i.cantidad, 0);
}

// Muestra el número de productos junto a "Carrito" en el menú
function actualizarContador() {
  const contador = document.getElementById('contador-carrito');
  if (!contador) return;
  const n = totalUnidades();
  contador.textContent = n;
  contador.hidden = n === 0;
}

// ---------- CUENTA ----------

// Envía datos al servidor (POST). Lanza un error con el mensaje del servidor si algo falla.
async function enviarApi(url, datos) {
  const respuesta = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos || {})
  });
  const cuerpo = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) throw new Error(cuerpo.error || 'Error ' + respuesta.status);
  return cuerpo;
}

// Cambia "Ingresar" por "Hola, Nombre" cuando hay sesión iniciada
async function actualizarCuenta() {
  const enlace = document.getElementById('enlace-cuenta');
  if (!enlace) return;
  try {
    const { usuario } = await pedirApi('/api/auth/yo');
    if (usuario) {
      enlace.textContent = 'Hola, ' + usuario.nombre.split(' ')[0];
      enlace.href = '/mi-cuenta.html';

      // Si es administrador, agrega el acceso al panel
      if (usuario.rol === 'admin' && !document.getElementById('enlace-admin')) {
        const admin = document.createElement('a');
        admin.id = 'enlace-admin';
        admin.href = '/admin/dashboard.html';
        admin.textContent = 'Panel admin';
        enlace.insertAdjacentElement('beforebegin', admin);
      }
    }
  } catch (error) {
    // Si falla, se queda como "Ingresar"
  }
}

// ---------- PEDIDOS ----------

// Número de pedido legible: 7 -> CT-00007
function numeroPedido(id) {
  return 'CT-' + String(id).padStart(5, '0');
}

const ETIQUETAS_ESTADO = {
  pendiente: 'Pendiente',
  confirmado: 'Confirmado',
  enviado: 'Enviado',
  entregado: 'Entregado',
  cancelado: 'Cancelado'
};

function etiquetaEstado(estado) {
  return ETIQUETAS_ESTADO[estado] || estado;
}

const ETIQUETAS_PAGO = {
  contra_entrega: 'Pago contra entrega',
  transferencia: 'Transferencia bancaria'
};

// La base de datos guarda la hora en UTC; aquí se convierte a la hora del navegador
function fechaLocal(texto) {
  const fecha = new Date(String(texto).replace(' ', 'T') + 'Z');
  if (isNaN(fecha)) return texto;
  return fecha.toLocaleString('es-SV', { dateStyle: 'medium', timeStyle: 'short' });
}