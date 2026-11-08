const db = require('../config/db');

function buscarPorCorreo(correo) {
  return db.prepare('SELECT * FROM usuarios WHERE correo = ?').get(correo);
}

// No devuelve la contraseña, para no filtrarla por accidente
function buscarPorId(id) {
  return db.prepare(
    'SELECT id, nombre, correo, telefono, rol, creado_en FROM usuarios WHERE id = ?'
  ).get(id);
}

// Todo usuario nuevo es "cliente". El rol nunca viene del formulario.
function crear({ nombre, correo, telefono, contrasenaHash }) {
  const resultado = db.prepare(
    'INSERT INTO usuarios (nombre, correo, telefono, contrasena, rol) VALUES (?, ?, ?, ?, ?)'
  ).run(nombre, correo, telefono || null, contrasenaHash, 'cliente');
  return Number(resultado.lastInsertRowid);
}

module.exports = { buscarPorCorreo, buscarPorId, crear };