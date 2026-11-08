const db = require('../config/db');

function listar() {
  return db.prepare('SELECT id, nombre, descripcion FROM categorias ORDER BY id').all();
}

module.exports = { listar };