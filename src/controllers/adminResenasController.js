const Resena = require('../models/resena');

exports.listar = (req, res) => {
  res.json(Resena.listarTodas());
};

exports.eliminar = (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || !Resena.eliminar(id)) {
    return res.status(404).json({ error: 'Reseña no encontrada' });
  }
  res.json({ ok: true });
};