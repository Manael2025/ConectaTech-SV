const Cupon = require('../models/adminCupones');

// Letras mayúsculas, números, guion y guion bajo (3 a 20 caracteres)
const REGEX_CODIGO = /^[A-Z0-9_-]{3,20}$/;

function idDe(req) {
  const id = Number(req.params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function responderError(res, error) {
  if (error instanceof Cupon.ErrorCupon) {
    return res.status(400).json({ error: error.message });
  }
  console.error(error);
  res.status(500).json({ error: 'Ocurrió un error. Intenta de nuevo.' });
}

exports.listar = (req, res) => {
  res.json(Cupon.listar());
};

exports.crear = (req, res) => {
  try {
    const codigo = String(req.body?.codigo ?? '').trim().toUpperCase();
    const porcentaje = Number(req.body?.porcentaje);

    if (!REGEX_CODIGO.test(codigo)) {
      return res.status(400).json({ error: 'El código debe tener de 3 a 20 caracteres: letras, números, guion o guion bajo' });
    }
    if (!Number.isInteger(porcentaje) || porcentaje < 1 || porcentaje > 90) {
      return res.status(400).json({ error: 'El descuento debe ser un número entero entre 1 y 90' });
    }

    Cupon.crear(codigo, porcentaje);
    res.status(201).json({ ok: true });
  } catch (error) {
    responderError(res, error);
  }
};

exports.activar = (req, res) => {
  const id = idDe(req);
  if (typeof req.body?.activo !== 'boolean') {
    return res.status(400).json({ error: 'Indica si el cupón debe estar activo' });
  }
  if (!id || !Cupon.cambiarActivo(id, req.body.activo)) {
    return res.status(404).json({ error: 'Cupón no encontrado' });
  }
  res.json({ ok: true });
};

exports.eliminar = (req, res) => {
  const id = idDe(req);
  if (!id || !Cupon.eliminar(id)) {
    return res.status(404).json({ error: 'Cupón no encontrado' });
  }
  res.json({ ok: true });
};