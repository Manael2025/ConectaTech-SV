const tabla = document.getElementById('tabla-productos');
const buscar = document.getElementById('buscar');
const filtroCategoria = document.getElementById('filtro-categoria');
const mensaje = document.getElementById('mensaje');
const dialogo = document.getElementById('dialogo');
const formulario = document.getElementById('form-producto');
const mensajeForm = document.getElementById('mensaje-form');
const campoOferta = document.getElementById('campo-oferta');

let productos = [];
let editandoId = null;

function mostrar(texto, tipo) {
  mensaje.className = 'mensaje ' + tipo;
  mensaje.textContent = texto;
}

function clasePorStock(stock) {
  if (stock === 0) return 'estado-cancelado';
  if (stock <= 10) return 'estado-pendiente';
  return 'estado-entregado';
}

function filaProducto(p) {
  const oferta = p.en_oferta === 1 && p.precio_oferta != null;
  return `
    <tr class="${p.activo ? '' : 'fila-inactiva'}">
      <td><img class="mini" src="${esc(p.imagen)}" alt=""
               onerror="this.onerror=null;this.src='${IMG_FALLBACK}'"></td>
      <td><strong>${esc(p.nombre)}</strong></td>
      <td>${esc(p.categoria)}</td>
      <td>${oferta
        ? `<s>${dinero(p.precio)}</s> <strong>${dinero(p.precio_oferta)}</strong>`
        : dinero(p.precio)}</td>
      <td><span class="estado ${clasePorStock(p.stock)}">${p.stock}</span></td>
      <td>${p.activo
        ? '<span class="estado estado-entregado">Activo</span>'
        : '<span class="estado">Inactivo</span>'}</td>
      <td class="acciones">
        <button class="enlace" data-accion="editar" data-id="${p.id}">Editar</button>
        <button class="enlace" data-accion="activar" data-id="${p.id}">${p.activo ? 'Desactivar' : 'Activar'}</button>
        <button class="enlace peligro" data-accion="eliminar" data-id="${p.id}">Eliminar</button>
      </td>
    </tr>`;
}

function dibujar() {
  const texto = buscar.value.trim().toLowerCase();
  const categoria = filtroCategoria.value;

  const visibles = productos.filter(p =>
    (!texto || p.nombre.toLowerCase().includes(texto)) &&
    (!categoria || String(p.categoria_id) === categoria)
  );

  if (visibles.length === 0) {
    tabla.innerHTML = '<p class="vacio">No hay productos que coincidan.</p>';
    return;
  }

  tabla.innerHTML = `
    <table class="tabla">
      <thead>
        <tr><th></th><th>Producto</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Estado</th><th></th></tr>
      </thead>
      <tbody>${visibles.map(filaProducto).join('')}</tbody>
    </table>`;
}

async function cargar() {
  try {
    const [categorias, lista] = await Promise.all([
      pedirApi('/api/categorias'),
      pedirApi('/api/admin/productos')
    ]);
    productos = lista;

    const opciones = categorias.map(c => `<option value="${c.id}">${esc(c.nombre)}</option>`).join('');
    const filtroActual = filtroCategoria.value;
    filtroCategoria.innerHTML = '<option value="">Todas las categorías</option>' + opciones;
    filtroCategoria.value = filtroActual;
    document.getElementById('categoria_id').innerHTML =
      '<option value="">Selecciona una categoría</option>' + opciones;

    dibujar();
  } catch (error) {
    tabla.innerHTML = '<p class="vacio">No se pudieron cargar los productos.</p>';
  }
}

function alternarOferta() {
  campoOferta.hidden = !formulario.en_oferta.checked;
}

function abrirFormulario(p) {
  editandoId = p ? p.id : null;
  document.getElementById('titulo-dialogo').textContent = p ? 'Editar producto' : 'Nuevo producto';

  formulario.reset();
  mensajeForm.className = '';
  mensajeForm.textContent = '';

  formulario.nombre.value = p ? p.nombre : '';
  formulario.descripcion.value = p ? (p.descripcion || '') : '';
  formulario.categoria_id.value = p ? p.categoria_id : '';
  formulario.precio.value = p ? p.precio : '';
  formulario.stock.value = p ? p.stock : 0;
  formulario.en_oferta.checked = p ? p.en_oferta === 1 : false;
  formulario.precio_oferta.value = p && p.precio_oferta != null ? p.precio_oferta : '';
  formulario.imagen.value = p && p.imagen && p.imagen !== IMG_FALLBACK ? p.imagen.replace(/^\/img\//, '') : '';
  formulario.activo.checked = p ? p.activo === 1 : true;

  alternarOferta();
  dialogo.showModal();
}

// Botones de la tabla
tabla.addEventListener('click', async (e) => {
  const boton = e.target.closest('[data-accion]');
  if (!boton) return;

  const producto = productos.find(p => p.id === Number(boton.dataset.id));
  if (!producto) return;

  try {
    if (boton.dataset.accion === 'editar') {
      abrirFormulario(producto);
    } else if (boton.dataset.accion === 'activar') {
      await llamarApi('PATCH', '/api/admin/productos/' + producto.id + '/activo', { activo: !producto.activo });
      mostrar(producto.activo ? 'Producto desactivado: ya no se ve en la tienda' : 'Producto activado', 'ok');
      await cargar();
    } else if (boton.dataset.accion === 'eliminar') {
      if (!confirm('¿Eliminar "' + producto.nombre + '"? Esta acción no se puede deshacer.')) return;
      await llamarApi('DELETE', '/api/admin/productos/' + producto.id);
      mostrar('Producto eliminado', 'ok');
      await cargar();
    }
  } catch (error) {
    mostrar(error.message, 'error');
  }
});

// Guardar (crear o editar)
formulario.addEventListener('submit', async (e) => {
  e.preventDefault();

  const datos = {
    nombre: formulario.nombre.value,
    descripcion: formulario.descripcion.value,
    categoria_id: formulario.categoria_id.value,
    precio: formulario.precio.value,
    stock: formulario.stock.value,
    en_oferta: formulario.en_oferta.checked,
    precio_oferta: formulario.precio_oferta.value,
    imagen: formulario.imagen.value,
    activo: formulario.activo.checked
  };

  const boton = formulario.querySelector('button[type="submit"]');
  boton.disabled = true;
  const eraEdicion = editandoId !== null;

  try {
    if (eraEdicion) {
      await llamarApi('PUT', '/api/admin/productos/' + editandoId, datos);
    } else {
      await llamarApi('POST', '/api/admin/productos', datos);
    }
    dialogo.close();
    mostrar(eraEdicion ? 'Producto actualizado' : 'Producto creado', 'ok');
    await cargar();
  } catch (error) {
    mensajeForm.className = 'mensaje error';
    mensajeForm.textContent = error.message;
  } finally {
    boton.disabled = false;
  }
});

document.getElementById('nuevo').addEventListener('click', () => abrirFormulario(null));
document.getElementById('cancelar').addEventListener('click', () => dialogo.close());
formulario.en_oferta.addEventListener('change', alternarOferta);
buscar.addEventListener('input', dibujar);
filtroCategoria.addEventListener('change', dibujar);

cargar();