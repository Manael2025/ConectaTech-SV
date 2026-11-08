const AdminPedidos = require('../models/adminPedidos');
const Pedido = require('../models/pedido');

function idDe(req) {
  const id = Number(req.params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function responderError(res, error) {
  if (error instanceof Pedido.ErrorPedido) {
    return res.status(400).json({ error: error.message });
  }
  console.error(error);
  res.status(500).json({ error: 'Ocurrió un error. Intenta de nuevo.' });
}

exports.listar = (req, res) => {
  const estado = String(req.query.estado ?? '').trim();
  const q = String(req.query.q ?? '').trim().slice(0, 60);
  res.json(AdminPedidos.listar({ estado, q }));
};

exports.obtener = (req, res) => {
  const id = idDe(req);
  const pedido = id ? AdminPedidos.obtener(id) : null;
  if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
  res.json(pedido);
};

exports.cambiarEstado = (req, res) => {
  try {
    const id = idDe(req);
    const nuevo = String(req.body?.estado ?? '');

    if (!id || !AdminPedidos.cambiarEstado(id, nuevo)) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    res.json(AdminPedidos.obtener(id));
  } catch (error) {
    responderError(res, error);
  }
};