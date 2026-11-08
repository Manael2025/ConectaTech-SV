const inpBuscar = document.getElementById('buscar');
const selCategoria = document.getElementById('categoria');
const selOrden = document.getElementById('orden');
const chkOferta = document.getElementById('oferta');
const contenedor = document.getElementById('productos');
const conteo = document.getElementById('conteo');

async function iniciar() {
  try {
    const categorias = await pedirApi('/api/categorias');
    selCategoria.innerHTML =
      '<option value="">Todas las categorías</option>' +
      categorias.map(c => `<option value="${c.id}">${esc(c.nombre)}</option>`).join('');
  } catch (error) { /* si falla, el filtro queda sin categorías */ }

  // Lee los filtros que vengan en la dirección (por ejemplo ?categoria=2)
  const params = new URLSearchParams(location.search);
  inpBuscar.value = params.get('buscar') || '';
  selCategoria.value = params.get('categoria') || '';
  selOrden.value = params.get('orden') || '';
  chkOferta.checked = params.get('oferta') === '1';

  cargarProductos();
}

async function cargarProductos() {
  const q = new URLSearchParams();
  if (inpBuscar.value.trim()) q.set('buscar', inpBuscar.value.trim());
  if (selCategoria.value) q.set('categoria', selCategoria.value);
  if (selOrden.value) q.set('orden', selOrden.value);
  if (chkOferta.checked) q.set('oferta', '1');

  try {
    const productos = await pedirApi('/api/productos?' + q.toString());
    conteo.textContent = productos.length + ' producto(s) encontrado(s)';
    contenedor.innerHTML = productos.length
      ? productos.map(tarjetaProducto).join('')
      : '<p class="vacio">No encontramos productos con esos filtros.</p>';
  } catch (error) {
    contenedor.innerHTML = '<p class="vacio">No se pudieron cargar los productos.</p>';
  }
}

// Espera un momento después de escribir para no pedir datos en cada letra
let espera;
inpBuscar.addEventListener('input', () => {
  clearTimeout(espera);
  espera = setTimeout(cargarProductos, 300);
});
selCategoria.addEventListener('change', cargarProductos);
selOrden.addEventListener('change', cargarProductos);
chkOferta.addEventListener('change', cargarProductos);

iniciar();