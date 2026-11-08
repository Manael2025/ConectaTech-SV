const id = new URLSearchParams(location.search).get('id');
const detalle = document.getElementById('detalle');

// 4.3 -> ★★★★☆
function estrellas(valor) {
  const llenas = Math.round(valor);
  return '★'.repeat(llenas) + '☆'.repeat(5 - llenas);
}

function unidadesEnCarrito(productoId) {
  const item = leerCarrito().find(i => i.id === productoId);
  return item ? item.cantidad : 0;
}

// Muestra un mensaje bajo el botón. Si es advertencia, sale en amarillo.
function avisar(texto, esAdvertencia, conEnlace) {
  document.getElementById('aviso').innerHTML =
    `<p class="mensaje${esAdvertencia ? ' aviso' : ''}">${esc(texto)}` +
    (conEnlace ? ' <a href="/carrito.html"><strong>Ver carrito</strong></a>' : '') +
    '</p>';
}

async function cargarProducto() {
  try {
    const p = await pedirApi('/api/productos/' + encodeURIComponent(id));
    const oferta = p.en_oferta === 1 && p.precio_oferta != null;
    const hayStock = p.stock > 0;

    document.title = p.nombre + ' | ConectaTech SV';

    detalle.innerHTML = `
      <div class="detalle">
        <div class="detalle-img">
          <img src="${esc(p.imagen)}" alt="${esc(p.nombre)}"
               onerror="this.onerror=null;this.src='${IMG_FALLBACK}'">
        </div>
        <div>
          <span class="tarjeta-cat">${esc(p.categoria)}</span>
          <h1>${esc(p.nombre)}</h1>
          <div class="precio">
            <strong>${dinero(p.precio_final)}</strong>
            ${oferta ? `<s>${dinero(p.precio)}</s>` : ''}
          </div>
          <p class="desc">${esc(p.descripcion)}</p>
          <p class="${hayStock ? 'stock-ok' : 'stock-no'}">
            ${hayStock ? 'Disponible (' + p.stock + ' en stock)' : 'Agotado'}
          </p>
          <div class="compra">
            <input type="number" id="cantidad" value="1" min="1" max="${p.stock}" ${hayStock ? '' : 'disabled'}>
            <button class="btn btn-prin" id="agregar" ${hayStock ? '' : 'disabled'}>Agregar al carrito</button>
          </div>
          <div id="aviso"></div>
        </div>
      </div>`;

    // Agregar al carrito, avisando si se pide más de lo que hay
    const boton = document.getElementById('agregar');
    const campoCantidad = document.getElementById('cantidad');

    if (boton) {
      boton.addEventListener('click', () => {
        let cantidad = parseInt(campoCantidad.value, 10);
        if (!Number.isInteger(cantidad) || cantidad < 1) cantidad = 1;

        const enCarrito = unidadesEnCarrito(p.id);
        const disponibles = p.stock - enCarrito;

        // Ya tiene en el carrito todo lo que hay
        if (disponibles <= 0) {
          avisar(`Ya tienes en tu carrito las ${p.stock} unidades disponibles. No tenemos más.`, true, true);
          campoCantidad.value = 1;
          return;
        }

        const aAgregar = Math.min(cantidad, disponibles);
        const total = agregarAlCarrito(p.id, aAgregar, p.stock);
        campoCantidad.value = 1;

        if (cantidad > disponibles) {
          const motivo = enCarrito > 0
            ? `Solo hay ${p.stock} unidades en total y ya tenías ${enCarrito} en tu carrito.`
            : `Solo tenemos ${p.stock} unidades de este producto.`;
          avisar(`${motivo} Agregamos ${aAgregar}; no hay más disponibles. Tienes ${total} en tu carrito.`, true, true);
        } else {
          avisar(`Agregado. Tienes ${total} unidad(es) en tu carrito.`, false, true);
        }
      });
    }

    cargarResenas(p.id);
  } catch (error) {
    detalle.innerHTML =
      '<p class="vacio">Producto no encontrado. <a href="/productos.html">Volver al catálogo</a></p>';
  }
}

// ---------- RESEÑAS ----------

const FORMULARIO_RESENA = `
  <form class="form-resena" id="form-resena" novalidate>
    <strong>Cuéntanos qué te pareció</strong>
    <div id="aviso-resena"></div>
    <div class="campo">
      <label for="calificacion">Calificación</label>
      <select id="calificacion" name="calificacion">
        <option value="5">★★★★★ Excelente</option>
        <option value="4">★★★★☆ Muy bueno</option>
        <option value="3">★★★☆☆ Normal</option>
        <option value="2">★★☆☆☆ Malo</option>
        <option value="1">★☆☆☆☆ Muy malo</option>
      </select>
    </div>
    <div class="campo">
      <label for="comentario">Comentario (opcional)</label>
      <textarea id="comentario" name="comentario" rows="3" maxlength="500"></textarea>
    </div>
    <button type="submit" class="btn btn-prin">Publicar opinión</button>
  </form>`;

async function cargarResenas(productoId) {
  const seccion = document.getElementById('resenas');

  try {
    const d = await pedirApi('/api/productos/' + productoId + '/resenas');
    seccion.hidden = false;

    // Promedio
    document.getElementById('resumen-resenas').innerHTML = d.total > 0
      ? `<p><span class="estrellas">${estrellas(d.promedio)}</span>
           <strong>${d.promedio.toFixed(1)}</strong> de 5 · ${d.total} opinión(es)</p>`
      : '<p class="ayuda">Este producto aún no tiene opiniones.</p>';

    // Formulario o mensaje, según quién consulta
    const zona = document.getElementById('formulario-resena');
    if (d.estado === 'puede') {
      zona.innerHTML = FORMULARIO_RESENA;
      activarFormulario(productoId);
    } else if (d.estado === 'anonimo') {
      const volver = encodeURIComponent('/producto.html?id=' + productoId);
      zona.innerHTML = `<p class="ayuda"><a href="/login.html?volver=${volver}"><strong>Inicia sesión</strong></a>
        si ya compraste este producto y quieres dejar tu opinión.</p>`;
    } else if (d.estado === 'ya_reseno') {
      zona.innerHTML = '<p class="ayuda">Gracias, ya opinaste sobre este producto.</p>';
    } else {
      zona.innerHTML = '<p class="ayuda">Solo los clientes que ya recibieron este producto pueden dejar su opinión.</p>';
    }

    // Lista
    document.getElementById('lista-resenas').innerHTML = d.resenas.map(r => `
      <div class="resena">
        <div>
          <span class="estrellas">${estrellas(r.calificacion)}</span>
          <strong>${esc(r.autor)}</strong>
          <span class="ayuda">· ${esc(fechaLocal(r.creado_en))}</span>
        </div>
        ${r.comentario ? `<p>${esc(r.comentario)}</p>` : ''}
      </div>`).join('');
  } catch (error) {
    // Si las reseñas fallan, la página del producto sigue funcionando
    seccion.hidden = true;
  }
}

function activarFormulario(productoId) {
  const formulario = document.getElementById('form-resena');
  const aviso = document.getElementById('aviso-resena');

  formulario.addEventListener('submit', async (e) => {
    e.preventDefault();
    const boton = formulario.querySelector('button[type="submit"]');
    boton.disabled = true;

    try {
      await enviarApi('/api/productos/' + productoId + '/resenas', {
        calificacion: formulario.calificacion.value,
        comentario: formulario.comentario.value
      });
      await cargarResenas(productoId);
    } catch (error) {
      aviso.className = 'mensaje error';
      aviso.textContent = error.message;
      boton.disabled = false;
    }
  });
}

cargarProducto();