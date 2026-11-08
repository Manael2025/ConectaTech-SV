const Categoria = require('../models/categoria');

exports.listar = (req, res) => {
  res.json(Categoria.listar());
};