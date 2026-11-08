const db = require('../config/db');

function crear({ nombre, correo, telefono, asunto, mensaje }) {
  db.prepare(`
    INSERT INTO mensajes_contacto (nombre, correo, telefono, asunto, mensaje)
    VALUES (?, ?, ?, ?, ?)
  `).run(nombre, correo, telefono || null, asunto, mensaje);
}

// Los no leídos primero, y luego los más recientes
function listar() {
  return db.prepare(
    'SELECT * FROM mensajes_contacto ORDER BY leido ASC, id DESC LIMIT 300'
  ).all();
}

function marcarLeido(id, leido) {
  return db.prepare('UPDATE mensajes_contacto SET leido = ? WHERE id = ?')
    .run(leido ? 1 : 0, id).changes > 0;
}

function eliminar(id) {
  return db.prepare('DELETE FROM mensajes_contacto WHERE id = ?').run(id).changes > 0;
}

module.exports = { crear, listar, marcarLeido, eliminar };