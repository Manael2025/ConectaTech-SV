const db = require('../config/db');

class ErrorProducto extends Error {}

// Incluye productos inactivos (a diferencia del catálogo público)
const BASE = `
  SELECT p.id, p.nombre, p.descripcion, p.precio, p.precio_oferta, p.en_oferta, p.stock,
         p.imagen, p.categoria_id, c.nombre AS categoria, p.activo, p.creado_en,
         CASE WHEN p.en_oferta = 1 AND p.precio_oferta IS NOT NULL
              THEN p.precio_oferta ELSE p.precio END AS precio_final
  FROM productos p
  JOIN categorias c ON c.id = p.categoria_id`;

function listar() {
  return db.prepare(BASE + ' ORDER BY p.id DESC').all();
}

function obtener(id) {
  return db.prepare(BASE + ' WHERE p.id = ?').get(id);
}

function categoriaExiste(id) {
  return Boolean(db.prepare('SELECT 1 FROM categorias WHERE id = ?').get(id));
}

function crear(d) {
  const resultado = db.prepare(`
    INSERT INTO productos
      (nombre, descripcion, precio, precio_oferta, en_oferta, stock, imagen, categoria_id, activo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(d.nombre, d.descripcion, d.precio, d.precioOferta, d.enOferta,
         d.stock, d.imagen, d.categoriaId, d.activo);
  return Number(resultado.lastInsertRowid);
}

function actualizar(id, d) {
  db.prepare(`
    UPDATE productos
    SET nombre = ?, descripcion = ?, precio = ?, precio_oferta = ?, en_oferta = ?,
        stock = ?, imagen = ?, categoria_id = ?, activo = ?
    WHERE id = ?
  `).run(d.nombre, d.descripcion, d.precio, d.precioOferta, d.enOferta,
         d.stock, d.imagen, d.categoriaId, d.activo, id);
}

function cambiarActivo(id, activo) {
  db.prepare('UPDATE productos SET activo = ? WHERE id = ?').run(activo ? 1 : 0, id);
}

// Solo se elimina si nunca se vendió (todo o nada)
const eliminar = db.transaction((id) => {
  const ventas = db.prepare('SELECT COUNT(*) AS n FROM detalle_pedido WHERE producto_id = ?').get(id).n;
  if (ventas > 0) {
    throw new ErrorProducto('Este producto ya tiene pedidos. Desactívalo en lugar de eliminarlo');
  }
  db.prepare('DELETE FROM resenas WHERE producto_id = ?').run(id);
  return db.prepare('DELETE FROM productos WHERE id = ?').run(id).changes > 0;
});

module.exports = { ErrorProducto, listar, obtener, categoriaExiste, crear, actualizar, cambiarActivo, eliminar };