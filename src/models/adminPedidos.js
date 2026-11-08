const db = require('../config/db');
const Pedido = require('./pedido');

// Qué estados puede tomar un pedido desde cada estado
const TRANSICIONES = {
  pendiente: ['confirmado', 'cancelado'],
  confirmado: ['enviado', 'cancelado'],
  enviado: ['entregado'],
  entregado: [],
  cancelado: []
};

// Lista con filtros opcionales (los 200 más recientes)
function listar({ estado, q }) {
  let sql = `
    SELECT id, nombre_cliente, correo, telefono, tipo_entrega, metodo_pago,
           departamento, total, estado, creado_en
    FROM pedidos WHERE 1 = 1`;
  const params = [];

  if (estado && Object.hasOwn(TRANSICIONES, estado)) {
    sql += ' AND estado = ?';
    params.push(estado);
  }

  if (q) {
    // Permite buscar por número de pedido: "2", "CT-2" o "CT-00002"
    const numero = /^(?:ct-?)?0*(\d+)$/i.exec(q);
    sql += ' AND (nombre_cliente LIKE ? OR correo LIKE ?' + (numero ? ' OR id = ?' : '') + ')';
    params.push('%' + q + '%', '%' + q + '%');
    if (numero) params.push(Number(numero[1]));
  }

  sql += ' ORDER BY id DESC LIMIT 200';
  return db.prepare(sql).all(...params);
}

// Detalle completo, con los estados a los que puede pasar
function obtener(id) {
  const pedido = Pedido.obtener(id);
  if (!pedido) return null;
  pedido.estados_siguientes = TRANSICIONES[pedido.estado] || [];
  return pedido;
}

// Cambia el estado. Si se cancela, devuelve las unidades al inventario. Todo o nada.
const cambiarEstado = db.transaction((id, nuevo) => {
  const pedido = db.prepare('SELECT id, estado FROM pedidos WHERE id = ?').get(id);
  if (!pedido) return false;

  const permitidos = TRANSICIONES[pedido.estado] || [];
  if (!permitidos.includes(nuevo)) {
    throw new Pedido.ErrorPedido('Ese cambio de estado no está permitido');
  }

  if (nuevo === 'cancelado') {
    const lineas = db.prepare('SELECT producto_id, cantidad FROM detalle_pedido WHERE pedido_id = ?').all(id);
    const devolver = db.prepare('UPDATE productos SET stock = stock + ? WHERE id = ?');
    for (const linea of lineas) {
      devolver.run(linea.cantidad, linea.producto_id);
    }
  }

  db.prepare('UPDATE pedidos SET estado = ? WHERE id = ?').run(nuevo, id);
  return true;
});

module.exports = { listar, obtener, cambiarEstado };