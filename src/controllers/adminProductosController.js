const Producto = require('../models/adminProductos');

// Nombre de archivo de imagen permitido: mouse.jpg o subcarpeta/mouse.png (sin espacios ni puntos extra)
const REGEX_IMAGEN = /^[\w-]+(\/[\w-]+)*\.(jpg|jpeg|png|webp|svg)$/i;

const r2 = (n) => Math.round(n * 100) / 100;

function texto(valor, max) {
  return String(valor ?? '').trim().slice(0, max);
}

function idDe(req) {
  const id = Number(req.params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function responderError(res, error) {
  if (error instanceof Producto.ErrorProducto) {
    return res.status(400).json({ error: error.message });
  }
  console.error(error);
  res.status(500).json({ error: 'Ocurrió un error. Intenta de nuevo.' });
}

// Valida lo que llega del formulario y lo deja listo para guardar
function leerProducto(b = {}) {
  const E = Producto.ErrorProducto;

  const nombre = texto(b.nombre, 100);
  const descripcion = texto(b.descripcion, 500);
  const precio = Number(b.precio);
  const stock = Number(b.stock);
  const categoriaId = Number(b.categoria_id);
  const enOferta = b.en_oferta === true ? 1 : 0;
  const activo = b.activo === false ? 0 : 1;

  if (nombre.length < 2) throw new E('Escribe el nombre del producto');
  if (!Number.isFinite(precio) || precio <= 0 || precio > 9999.99) {
    throw new E('El precio debe ser mayor que 0');
  }
  if (!Number.isInteger(stock) || stock < 0 || stock > 100000) {
    throw new E('El stock debe ser un número entero, 0 o más');
  }
  if (!Producto.categoriaExiste(categoriaId)) throw new E('Elige una categoría');

  let precioOferta = null;
  if (enOferta) {
    precioOferta = Number(b.precio_oferta);
    if (!Number.isFinite(precioOferta) || precioOferta <= 0 || precioOferta >= precio) {
      throw new E('El precio de oferta debe ser mayor que 0 y menor que el precio normal');
    }
    precioOferta = r2(precioOferta);
  }

  let imagen = '/img/placeholder.svg';
  const archivo = texto(b.imagen, 120);
  if (archivo) {
    if (!REGEX_IMAGEN.test(archivo)) {
      throw new E('La imagen debe ser un archivo .jpg, .png, .webp o .svg, sin espacios (ejemplo: mouse.jpg)');
    }
    imagen = '/img/' + archivo;
  }

  return { nombre, descripcion, precio: r2(precio), precioOferta, enOferta, stock, imagen, categoriaId, activo };
}

exports.listar = (req, res) => {
  res.json(Producto.listar());
};

exports.obtener = (req, res) => {
  const id = idDe(req);
  const producto = id ? Producto.obtener(id) : null;
  if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
  res.json(producto);
};

exports.crear = (req, res) => {
  try {
    const id = Producto.crear(leerProducto(req.body));
    res.status(201).json(Producto.obtener(id));
  } catch (error) {
    responderError(res, error);
  }
};

exports.actualizar = (req, res) => {
  try {
    const id = idDe(req);
    if (!id || !Producto.obtener(id)) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    Producto.actualizar(id, leerProducto(req.body));
    res.json(Producto.obtener(id));
  } catch (error) {
    responderError(res, error);
  }
};

exports.activar = (req, res) => {
  const id = idDe(req);
  if (!id || !Producto.obtener(id)) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }
  if (typeof req.body?.activo !== 'boolean') {
    return res.status(400).json({ error: 'Indica si el producto debe estar activo' });
  }
  Producto.cambiarActivo(id, req.body.activo);
  res.json(Producto.obtener(id));
};

exports.eliminar = (req, res) => {
  try {
    const id = idDe(req);
    if (!id || !Producto.eliminar(id)) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json({ ok: true });
  } catch (error) {
    responderError(res, error);
  }
};