const Mensaje = require('../models/mensaje');

function idDe(req) {
  const id = Number(req.params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

exports.listar = (req, res) => {
  res.json(Mensaje.listar());
};

exports.marcarLeido = (req, res) => {
  const id = idDe(req);
  if (typeof req.body?.leido !== 'boolean') {
    return res.status(400).json({ error: 'Indica si el mensaje está leído' });
  }
  if (!id || !Mensaje.marcarLeido(id, req.body.leido)) {
    return res.status(404).json({ error: 'Mensaje no encontrado' });
  }
  res.json({ ok: true });
};

exports.eliminar = (req, res) => {
  const id = idDe(req);
  if (!id || !Mensaje.eliminar(id)) {
    return res.status(404).json({ error: 'Mensaje no encontrado' });
  }
  res.json({ ok: true });
};