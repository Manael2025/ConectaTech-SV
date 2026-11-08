const db = require('../config/db');

// precio_final = precio de oferta si está en oferta, si no el precio normal
const BASE_SQL = `
  SELECT p.id, p.nombre, p.descripcion, p.precio, p.precio_oferta, p.en_oferta,
         p.stock, p.imagen, p.categoria_id, c.nombre AS categoria,
         CASE WHEN p.en_oferta = 1 AND p.precio_oferta IS NOT NULL
              THEN p.precio_oferta ELSE p.precio END AS precio_final
  FROM productos p
  JOIN categorias c ON c.id = p.categoria_id
  WHERE p.activo = 1`;

function listar({ categoria, buscar, oferta, orden }) {
  let sql = BASE_SQL;
  const params = [];

  if (categoria) {
    sql += ' AND p.categoria_id = ?';
    params.push(Number(categoria));
  }
  if (buscar) {
    sql += ' AND (p.nombre LIKE ? OR p.descripcion LIKE ?)';
    params.push(`%${buscar}%`, `%${buscar}%`);
  }
  if (oferta === '1') {
    sql += ' AND p.en_oferta = 1';
  }

  // Lista cerrada de ordenamientos permitidos (por seguridad)
  const ordenes = {
    precio_asc: 'precio_final ASC',
    precio_desc: 'precio_final DESC',
    nombre: 'p.nombre ASC'
  };
  sql += ' ORDER BY ' + (ordenes[orden] || 'p.id ASC');

  return db.prepare(sql).all(...params);
}

function obtenerPorId(id) {
  return db.prepare(BASE_SQL + ' AND p.id = ?').get(Number(id));
}

module.exports = { listar, obtenerPorId };