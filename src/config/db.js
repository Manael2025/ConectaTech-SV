const path = require('path');
const Database = require('better-sqlite3');
const fs = require('fs');

// Intentar buscar el archivo en la raíz, en la carpeta base de datos o en la carpeta actual
let dbPath = path.join(__dirname, '..', '..', 'base de datos', 'conectatech.db');

if (!fs.existsSync(dbPath)) {
    // Si no lo encuentra ahí, busca en la raíz directa del proyecto en Render
    dbPath = path.join(process.cwd(), 'base de datos', 'conectatech.db');
}

if (!fs.existsSync(dbPath)) {
    // Tercer intento: buscar en la carpeta raíz directa por si se movió al subirlo
    dbPath = path.join(process.cwd(), 'conectatech.db');
}

console.log("Ruta final de la base de datos que usará Render:", dbPath);

const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

module.exports = db;
