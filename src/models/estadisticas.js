const db = require('../config/db');

const UMBRAL_STOCK_BAJO = 10;
const ESTADOS = ['pendiente', 'confirmado', 'enviado', 'entregado', 'cancelado'];

const r2 = (n) => Math.round(n * 100) / 100;

// Fecha (AAAA-MM-DD) de hace N días, en hora de El Salvador (UTC-6, sin horario de verano)
function diaLocal(haceDias) {
  const ms = Date.now() - 6 * 3600 * 1000 - haceDias * 86400000;
  return new Date(ms).toISOString().slice(0, 10);
}

function resumen() {
  // Los pedidos cancelados no cuentan como ventas
  const ventas = db.prepare(
    `SELECT COUNT(*) AS pedidos, COALESCE(SUM(total), 0) AS total
     FROM pedidos WHERE estado != 'cancelado'`
  ).get();

  const pendientes = db.prepare(`SELECT COUNT(*) AS n FROM pedidos WHERE estado = 'pendiente'`).get().n;
  const clientes = db.prepare(`SELECT COUNT(*) AS n FROM usuarios WHERE rol = 'cliente'`).get().n;
  const mensajes = db.prepare(`SELECT COUNT(*) AS n FROM mensajes_contacto WHERE leido = 0`).get().n;

  // Ventas por día, últimos 7 días (se rellenan con 0 los días sin ventas)
  const filasDia = db.prepare(
    `SELECT date(creado_en, '-6 hours') AS dia, SUM(total) AS total
     FROM pedidos
     WHERE estado != 'cancelado' AND date(creado_en, '-6 hours') >= ?
     GROUP BY dia`
  ).all(diaLocal(6));

  const ventasPorDia = [];
  for (let i = 6; i >= 0; i--) {
    const dia = diaLocal(i);
    const fila = filasDia.find(f => f.dia === dia);
    ventasPorDia.push({ dia: dia, total: fila ? r2(fila.total) : 0 });
  }

  // Pedidos por estado (siempre aparecen los 5 estados)
  const filasEstado = db.prepare('SELECT estado, COUNT(*) AS cantidad FROM pedidos GROUP BY estado').all();
  const pedidosPorEstado = ESTADOS.map(estado => {
    const fila = filasEstado.find(f => f.estado === estado);
    return { estado: estado, cantidad: fila ? fila.cantidad : 0 };
  });

  // Productos más vendidos
  const topProductos = db.prepare(
    `SELECT d.nombre_producto AS nombre, SUM(d.cantidad) AS unidades, SUM(d.subtotal) AS ingresos
     FROM detalle_pedido d
     JOIN pedidos p ON p.id = d.pedido_id
     WHERE p.estado != 'cancelado'
     GROUP BY d.producto_id, d.nombre_producto
     ORDER BY unidades DESC, ingresos DESC
     LIMIT 5`
  ).all();

  // Ventas por categoría
  const ventasPorCategoria = db.prepare(
    `SELECT c.nombre AS categoria, SUM(d.subtotal) AS total
     FROM detalle_pedido d
     JOIN pedidos p ON p.id = d.pedido_id
     JOIN productos pr ON pr.id = d.producto_id
     JOIN categorias c ON c.id = pr.categoria_id
     WHERE p.estado != 'cancelado'
     GROUP BY c.id
     ORDER BY total DESC`
  ).all();

  const pedidosRecientes = db.prepare(
    `SELECT id, nombre_cliente, total, estado, creado_en
     FROM pedidos ORDER BY id DESC LIMIT 5`
  ).all();

  const stockBajo = db.prepare(
    `SELECT id, nombre, stock FROM productos
     WHERE activo = 1 AND stock <= ?
     ORDER BY stock ASC, nombre ASC LIMIT 8`
  ).all(UMBRAL_STOCK_BAJO);

  return {
    ventas_total: r2(ventas.total),
    pedidos_total: ventas.pedidos,
    pedidos_pendientes: pendientes,
    ticket_promedio: ventas.pedidos > 0 ? r2(ventas.total / ventas.pedidos) : 0,
    clientes: clientes,
    mensajes_sin_leer: mensajes,
    ventas_por_dia: ventasPorDia,
    pedidos_por_estado: pedidosPorEstado,
    top_productos: topProductos,
    ventas_por_categoria: ventasPorCategoria,
    pedidos_recientes: pedidosRecientes,
    stock_bajo: stockBajo,
    umbral_stock_bajo: UMBRAL_STOCK_BAJO
  };
}

module.exports = { resumen };