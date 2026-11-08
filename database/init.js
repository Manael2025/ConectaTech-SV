const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('../src/config/db');

// 1. Crear tablas
db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));

// 2. Cargar datos iniciales solo si la tienda está vacía
const { total } = db.prepare('SELECT COUNT(*) AS total FROM productos').get();
if (total === 0) {
  db.exec(fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8'));
  console.log('Productos y categorías cargados.');
} else {
  console.log('La base de datos ya tenía productos, no se cargaron de nuevo.');
}

// 3. Crear administrador si no existe
const admin = db.prepare('SELECT id FROM usuarios WHERE correo = ?').get('admin@conectatech.sv');
if (!admin) {
  const hash = bcrypt.hashSync('Admin123!', 10);
  db.prepare('INSERT INTO usuarios (nombre, correo, contrasena, rol) VALUES (?, ?, ?, ?)')
    .run('Administrador', 'admin@conectatech.sv', hash, 'admin');
  console.log('Administrador creado: admin@conectatech.sv');
}

console.log('Base de datos lista.');