const contenedor = document.getElementById('carrito');
let lineas = []; // [{ p: producto, cantidad: n }]

async function cargarCarrito() {
  const guardado = leerCarrito();
  if (guardado.length === 0) return dibujar();

  try {
    // Pide al servidor los datos actuales de cada producto.
    // Solo un "404" significa que el producto ya no existe; cualquier otro fallo corta todo
    // para no vaciar el carrito por un problema de conexión.
    const productos = await Promise.all(guardado.map(async (item) => {
      try {
        return await pedirApi('/api/productos/' + item.id);
      } catch (error) {
        if (error.message === 'Error 404') return null;
        throw error;
      }
    }));

    lineas = [];
    const avisos = [];

    guardado.forEach((item, i) => {
      const p = productos[i];

      if (!p) {
        avisos.push('Un producto ya no está disponible y se quitó de tu carrito.');
        return;
      }
      if (p.stock <= 0) {
        avisos.push('"' + p.nombre + '" se agotó y se quitó de tu carrito.');
        return;
      }
      if (item.cantidad > p.stock) {
        avisos.push('De "' + p.nombre + '" solo quedan ' + p.stock + ' unidades; ajustamos la cantidad.');
      }
      lineas.push({ p: p, cantidad: Math.min(item.cantidad, p.stock) });
    });

    sincronizar();
    dibujar();
    mostrarAvisos(avisos);
  } catch (error) {
    contenedor.innerHTML = '<p class="vacio">No se pudo cargar el carrito.</p>';
  }
}

// Avisos de cambios en la disponibilidad (aparecen arriba del carrito)
function mostrarAvisos(avisos) {
  if (avisos.length === 0) return;
  contenedor.insertAdjacentHTML('afterbegin',
    '<div class="mensaje aviso">' + avisos.map(a => esc(a)).join('<br>') + '</div>');
}

// Guarda en el navegador lo que hay en pantalla
function sincronizar() {
  guardarCarrito(lineas.map(l => ({ id: l.p.id, cantidad: l.cantidad })));
}

function mostrarVacio() {
  contenedor.innerHTML = `
    <div class="vacio">
      <p>Tu carrito está vacío.</p><br>
      <a href="/productos.html" class="btn btn-prin">Ver productos</a>
    </div>`;
}

function dibujar() {
  if (lineas.length === 0) return mostrarVacio();

  const subtotal = lineas.reduce((suma, l) => suma + l.p.precio_final * l.cantidad, 0);
  const unidades = lineas.reduce((suma, l) => suma + l.cantidad, 0);

  contenedor.innerHTML = `
    <div class="carrito-grid">
      <div class="carrito-lista">
        ${lineas.map(l => `
          <div class="linea">
            <img src="${esc(l.p.imagen)}" alt="${esc(l.p.nombre)}"
                 onerror="this.onerror=null;this.src='${IMG_FALLBACK}'">
            <div class="linea-info">
              <a href="/producto.html?id=${l.p.id}"><strong>${esc(l.p.nombre)}</strong></a>
              <span class="tarjeta-cat">${esc(l.p.categoria)}</span>
              <span>${dinero(l.p.precio_final)} c/u</span>
            </div>
            <div class="linea-cant">
              <button class="mas-menos" data-accion="menos" data-id="${l.p.id}">−</button>
              <span>${l.cantidad}</span>
              <button class="mas-menos" data-accion="mas" data-id="${l.p.id}"
                ${l.cantidad >= l.p.stock ? 'disabled' : ''}>+</button>
            </div>
            <div class="linea-sub">${dinero(l.p.precio_final * l.cantidad)}</div>
            <button class="quitar" data-accion="quitar" data-id="${l.p.id}">Quitar</button>
          </div>`).join('')}
      </div>

      <aside class="resumen">
        <h3>Resumen</h3>
        <p><span>Productos (${unidades})</span><span>${dinero(subtotal)}</span></p>
        <p><span>Envío</span><span>Se calcula al pagar</span></p>
        <p class="resumen-total"><span>Total</span><span>${dinero(subtotal)}</span></p>
        <a href="/checkout.html" class="btn btn-prin" style="width:100%">Finalizar compra</a>
        <button class="btn btn-sec" data-accion="vaciar" style="margin-top:10px">Vaciar carrito</button>
        <a href="/productos.html" class="seguir">Seguir comprando</a>
      </aside>
    </div>`;
}

// Un solo "escuchador" para todos los botones del carrito
contenedor.addEventListener('click', (e) => {
  const boton = e.target.closest('[data-accion]');
  if (!boton) return;

  const accion = boton.dataset.accion;
  const id = Number(boton.dataset.id);
  const linea = lineas.find(l => l.p.id === id);

  if (accion === 'mas' && linea && linea.cantidad < linea.p.stock) {
    linea.cantidad++;
  } else if (accion === 'menos' && linea) {
    linea.cantidad--;
    if (linea.cantidad <= 0) lineas = lineas.filter(l => l.p.id !== id);
  } else if (accion === 'quitar') {
    lineas = lineas.filter(l => l.p.id !== id);
  } else if (accion === 'vaciar') {
    lineas = [];
  }

  sincronizar();
  dibujar();
});

cargarCarrito();