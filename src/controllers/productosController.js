const Producto = require('../models/producto');

exports.listar = (req, res) => {
  const productos = Producto.listar(req.query);
  res.json(productos);
};

exports.detalle = (req, res) => {
  const producto = Producto.obtenerPorId(req.params.id);
  if (!producto) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }
  res.json(producto);
};