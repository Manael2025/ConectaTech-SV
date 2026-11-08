const Estadisticas = require('../models/estadisticas');
const Clientes = require('../models/adminClientes');

exports.dashboard = (req, res) => {
  res.json(Estadisticas.resumen());
};

exports.clientes = (req, res) => {
  res.json(Clientes.listar());
};