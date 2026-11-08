const Resena = require('../models/resena');

function idDe(req) {
  const id = Number(req.params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function responderError(res, error) {
  if (error instanceof Resena.ErrorResena) {
    return res.status(error.estado).json({ error: error.message });
  }
  console.error(error);
  res.status(500).json({ error: 'Ocurrió un error. Intenta de nuevo.' });
}

// Reseñas de un producto (público). También dice si quien consulta puede opinar.
exports.listar = (req, res) => {
  const id = idDe(req);
  if (!id || !Resena.productoExiste(id)) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  const usuarioId = req.session.usuarioId || null;
  let estado = 'anonimo';
  if (usuarioId) {
    if (Resena.yaReseno(id, usuarioId)) estado = 'ya_reseno';
    else if (Resena.haRecibido(id, usuarioId)) estado = 'puede';
    else estado = 'sin_compra';
  }

  const { total, promedio } = Resena.resumen(id);
  res.json({ total, promedio, estado, resenas: Resena.listar(id) });
};

// Publicar una reseña (requiere sesión)
exports.crear = (req, res) => {
  try {
    const id = idDe(req);
    if (!id || !Resena.productoExiste(id)) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const calificacion = Number(req.body?.calificacion);
    const comentario = String(req.body?.comentario ?? '').trim().slice(0, 500);

    if (!Number.isInteger(calificacion) || calificacion < 1 || calificacion > 5) {
      return res.status(400).json({ error: 'Elige una calificación de 1 a 5' });
    }

    Resena.crear(id, req.usuario.id, calificacion, comentario);
    res.status(201).json({ ok: true });
  } catch (error) {
    responderError(res, error);
  }
};