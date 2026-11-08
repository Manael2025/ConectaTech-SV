const contenedor = document.getElementById('ofertas');

async function cargar() {
  try {
    const productos = await pedirApi('/api/productos?oferta=1&orden=precio_asc');
    contenedor.innerHTML = productos.length
      ? productos.map(tarjetaProducto).join('')
      : '<p class="vacio">Por ahora no hay ofertas. ¡Vuelve pronto!</p>';
  } catch (error) {
    contenedor.innerHTML = '<p class="vacio">No se pudieron cargar las ofertas.</p>';
  }
}

cargar();