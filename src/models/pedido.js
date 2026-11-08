const db = require('../config/db');
const { costoEnvio, ENVIO_GRATIS_DESDE } = require('../config/envio');

// Errores "esperados" (datos inválidos, sin stock...). Se muestran al cliente tal cual.
class ErrorPedido extends Error {}

const r2 = (n) => Math.round(n * 100) / 100;

// Calcula todo el pedido usando SOLO datos de la base de datos
function calcular(items, { tipoEntrega, departamento, codigoCupon }) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new ErrorPedido('Tu carrito está vacío');
  }
  if (items.length > 20) {
    throw new ErrorPedido('Hay demasiados productos en el pedido');
  }
  if (!['domicilio', 'retiro'].includes(tipoEntrega)) {
    throw new ErrorPedido('Elige cómo quieres recibir tu pedido');
  }

  const buscar = db.prepare(
    'SELECT id, nombre, stock, precio, precio_oferta, en_oferta FROM productos WHERE id = ? AND activo = 1'
  );

  const lineas = [];
  const vistos = new Set();

  for (const item of items) {
    const id = Number(item.id);
    const cantidad = Number(item.cantidad);

    if (!Number.isInteger(id) || !Number.isInteger(cantidad) || cantidad < 1 || cantidad > 99) {
      throw new ErrorPedido('Hay datos inválidos en tu carrito');
    }
    if (vistos.has(id)) {
      throw new ErrorPedido('Hay productos repetidos en tu carrito');
    }
    vistos.add(id);

    const p = buscar.get(id);
    if (!p) throw new ErrorPedido('Uno de los productos ya no está disponible');
    if (p.stock < cantidad) {
      throw new ErrorPedido(`No hay suficiente stock de "${p.nombre}" (disponibles: ${p.stock})`);
    }

    const precio = (p.en_oferta === 1 && p.precio_oferta != null) ? p.precio_oferta : p.precio;
    lineas.push({
      producto_id: p.id,
      nombre: p.nombre,
      precio_unitario: precio,
      cantidad: cantidad,
      subtotal: r2(precio * cantidad)
    });
  }

  const subtotal = r2(lineas.reduce((suma, l) => suma + l.subtotal, 0));

  // Cupón
  let cupon = null;
  let descuento = 0;
  if (codigoCupon) {
    cupon = db.prepare('SELECT codigo, porcentaje FROM cupones WHERE codigo = ? AND activo = 1')
      .get(String(codigoCupon).trim().toUpperCase());
    if (!cupon) throw new ErrorPedido('El cupón no es válido');
    descuento = r2(subtotal * cupon.porcentaje / 100);
  }

  // Envío
  const baseEnvio = r2(subtotal - descuento);
  let envio = 0;
  let envioPendiente = false;
  if (tipoEntrega === 'domicilio' && baseEnvio < ENVIO_GRATIS_DESDE) {
    const costo = costoEnvio(departamento);
    if (costo === null) envioPendiente = true; // todavía no eligió departamento
    else envio = costo;
  }

  return {
    lineas,
    subtotal,
    descuento,
    envio,
    envioPendiente,
    total: r2(baseEnvio + envio),
    cupon: cupon ? cupon.codigo : null
  };
}

// Guarda el pedido y baja el stock. Todo o nada (transacción).
const crearTransaccion = db.transaction((usuarioId, datos, items) => {
  const t = calcular(items, {
    tipoEntrega: datos.tipoEntrega,
    departamento: datos.departamento,
    codigoCupon: datos.codigoCupon
  });
  if (t.envioPendiente) throw new ErrorPedido('Elige el departamento de entrega');

  const resultado = db.prepare(`
    INSERT INTO pedidos
      (usuario_id, nombre_cliente, correo, telefono, departamento, municipio, direccion,
       tipo_entrega, metodo_pago, notas, subtotal, descuento, envio, total)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    usuarioId, datos.nombre, datos.correo, datos.telefono,
    datos.departamento, datos.municipio, datos.direccion,
    datos.tipoEntrega, datos.metodoPago, datos.notas,
    t.subtotal, t.descuento, t.envio, t.total
  );
  const pedidoId = Number(resultado.lastInsertRowid);

  const insertarDetalle = db.prepare(`
    INSERT INTO detalle_pedido (pedido_id, producto_id, nombre_producto, precio_unitario, cantidad, subtotal)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  // Solo baja el stock si todavía alcanza
  const bajarStock = db.prepare('UPDATE productos SET stock = stock - ? WHERE id = ? AND stock >= ?');

  for (const l of t.lineas) {
    insertarDetalle.run(pedidoId, l.producto_id, l.nombre, l.precio_unitario, l.cantidad, l.subtotal);
    const baja = bajarStock.run(l.cantidad, l.producto_id, l.cantidad);
    if (baja.changes === 0) {
      throw new ErrorPedido(`No hay suficiente stock de "${l.nombre}"`);
    }
  }

  return pedidoId;
});

function listarDeUsuario(usuarioId) {
  return db.prepare(
    'SELECT id, total, estado, tipo_entrega, creado_en FROM pedidos WHERE usuario_id = ? ORDER BY id DESC'
  ).all(usuarioId);
}

function obtener(id) {
  const pedido = db.prepare('SELECT * FROM pedidos WHERE id = ?').get(id);
  if (!pedido) return null;
  pedido.detalle = db.prepare(
    'SELECT nombre_producto, precio_unitario, cantidad, subtotal FROM detalle_pedido WHERE pedido_id = ?'
  ).all(id);
  return pedido;
}

module.exports = { ErrorPedido, calcular, crear: crearTransaccion, listarDeUsuario, obtener };