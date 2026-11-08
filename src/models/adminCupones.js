const db = require('../config/db');

class ErrorCupon extends Error {}

function listar() {
  return db.prepare('SELECT id, codigo, porcentaje, activo FROM cupones ORDER BY id DESC').all();
}

function crear(codigo, porcentaje) {
  try {
    db.prepare('INSERT INTO cupones (codigo, porcentaje, activo) VALUES (?, ?, 1)').run(codigo, porcentaje);
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') throw new ErrorCupon('Ese código ya existe');
    throw error;
  }
}

function cambiarActivo(id, activo) {
  return db.prepare('UPDATE cupones SET activo = ? WHERE id = ?').run(activo ? 1 : 0, id).changes > 0;
}

function eliminar(id) {
  return db.prepare('DELETE FROM cupones WHERE id = ?').run(id).changes > 0;
}

module.exports = { ErrorCupon, listar, crear, cambiarActivo, eliminar };