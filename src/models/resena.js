const db = require('../config/db');

// "estado" es el código HTTP que se devolverá al cliente
class ErrorResena extends Error {
  constructor(mensaje, estado = 400) {
    super(mensaje);
    this.estado = estado;
  }
}

function productoExiste(id) {
  return Boolean(db.prepare('SELECT 1 FROM productos WHERE id = ? AND activo = 1').get(id));
}

// Solo cuenta si el cliente tiene un pedido ENTREGADO con ese producto
function haRecibido(productoId, usuarioId) {
  return Boolean(db.prepare(`
    SELECT 1 FROM detalle_pedido d
    JOIN pedidos p ON p.id = d.pedido_id
    WHERE d.producto_id = ? AND p.usuario_id = ? AND p.estado = 'entregado'
    LIMIT 1
  `).get(productoId, usuarioId));
}

function yaReseno(productoId, usuarioId) {
  return Boolean(db.prepare('SELECT 1 FROM resenas WHERE producto_id = ? AND usuario_id = ?').get(productoId, usuarioId));
}

function resumen(productoId) {
  const fila = db.prepare(
    'SELECT COUNT(*) AS total, AVG(calificacion) AS promedio FROM resenas WHERE producto_id = ?'
  ).get(productoId);
  return {
    total: fila.total,
    promedio: fila.promedio === null ? 0 : Math.round(fila.promedio * 10) / 10
  };
}

// "KEVIN ALEXANDER BENIEZ" -> "Kevin A."
function autorCorto(nombre) {
  const [primero, segundo] = String(nombre).trim().split(/\s+/);
  const nombreBonito = primero.charAt(0).toUpperCase() + primero.slice(1).toLowerCase();
  return segundo ? nombreBonito + ' ' + segundo.charAt(0).toUpperCase() + '.' : nombreBonito;
}

function listar(productoId) {
  return db.prepare(`
    SELECT r.calificacion, r.comentario, r.creado_en, u.nombre
    FROM resenas r JOIN usuarios u ON u.id = r.usuario_id
    WHERE r.producto_id = ?
    ORDER BY r.id DESC LIMIT 50
  `).all(productoId).map(r => ({
    calificacion: r.calificacion,
    comentario: r.comentario,
    creado_en: r.creado_en,
    autor: autorCorto(r.nombre)
  }));
}

function crear(productoId, usuarioId, calificacion, comentario) {
  if (!haRecibido(productoId, usuarioId)) {
    throw new ErrorResena('Solo puedes opinar sobre productos que ya recibiste', 403);
  }
  if (yaReseno(productoId, usuarioId)) {
    throw new ErrorResena('Ya opinaste sobre este producto', 409);
  }
  try {
    db.prepare(
      'INSERT INTO resenas (producto_id, usuario_id, calificacion, comentario) VALUES (?, ?, ?, ?)'
    ).run(productoId, usuarioId, calificacion, comentario || null);
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw new ErrorResena('Ya opinaste sobre este producto', 409);
    }
    throw error;
  }
}

// Para el panel de administración
function listarTodas() {
  return db.prepare(`
    SELECT r.id, r.calificacion, r.comentario, r.creado_en,
           p.nombre AS producto, u.nombre AS autor, u.correo
    FROM resenas r
    JOIN productos p ON p.id = r.producto_id
    JOIN usuarios u ON u.id = r.usuario_id
    ORDER BY r.id DESC LIMIT 300
  `).all();
}

function eliminar(id) {
  return db.prepare('DELETE FROM resenas WHERE id = ?').run(id).changes > 0;
}

module.exports = { ErrorResena, productoExiste, haRecibido, yaReseno, resumen, listar, crear, listarTodas, eliminar };