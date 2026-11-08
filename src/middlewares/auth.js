const Usuario = require('../models/usuario');

function usuarioDeSesion(req) {
  return req.session.usuarioId ? Usuario.buscarPorId(req.session.usuarioId) : null;
}

// Exige que haya una sesión iniciada (para la API)
function requiereLogin(req, res, next) {
  const usuario = usuarioDeSesion(req);
  if (!usuario) {
    return res.status(401).json({ error: 'Debes iniciar sesión' });
  }
  req.usuario = usuario;
  next();
}

// Exige que además sea administrador (para la API)
function requiereAdmin(req, res, next) {
  const usuario = usuarioDeSesion(req);
  if (!usuario) {
    return res.status(401).json({ error: 'Debes iniciar sesión' });
  }
  if (usuario.rol !== 'admin') {
    return res.status(403).json({ error: 'No tienes permiso para esto' });
  }
  req.usuario = usuario;
  next();
}

// Protege las PÁGINAS de /admin: el archivo ni siquiera se entrega si no eres admin
function protegerPaginaAdmin(req, res, next) {
  const usuario = usuarioDeSesion(req);
  if (!usuario) {
    return res.redirect('/login.html?volver=' + encodeURIComponent(req.originalUrl));
  }
  if (usuario.rol !== 'admin') {
    return res.status(403).send('No tienes permiso para ver esta página.');
  }
  next();
}

module.exports = { requiereLogin, requiereAdmin, protegerPaginaAdmin };