const db = require('../config/db');

const r2 = (n) => Math.round(n * 100) / 100;

// Clientes con su actividad de compra (los pedidos cancelados no suman al total)
function listar() {
  const filas = db.prepare(`
    SELECT u.id, u.nombre, u.correo, u.telefono, u.creado_en,
           COUNT(p.id) AS pedidos,
           COALESCE(SUM(CASE WHEN p.estado != 'cancelado' THEN p.total END), 0) AS total_comprado,
           MAX(p.creado_en) AS ultimo_pedido
    FROM usuarios u
    LEFT JOIN pedidos p ON p.usuario_id = u.id
    WHERE u.rol = 'cliente'
    GROUP BY u.id
    ORDER BY total_comprado DESC, u.id DESC
  `).all();

  return filas.map(f => ({ ...f, total_comprado: r2(f.total_comprado) }));
}

module.exports = { listar };