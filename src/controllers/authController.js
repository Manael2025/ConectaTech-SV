const bcrypt = require('bcryptjs');
const Usuario = require('../models/usuario');

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGEX_TELEFONO = /^[0-9+\-\s]{8,15}$/;

// ----- Bloqueo por intentos fallidos (en memoria) -----
const MAX_INTENTOS = 5;
const BLOQUEO_MS = 15 * 60 * 1000;
const intentos = new Map(); // "ip|correo" -> { cuenta, hasta }

function estaBloqueado(clave) {
  const registro = intentos.get(clave);
  if (!registro || !registro.hasta) return false;
  if (registro.hasta > Date.now()) return true;
  intentos.delete(clave); // el bloqueo ya venció
  return false;
}

function registrarFallo(clave) {
  const registro = intentos.get(clave) || { cuenta: 0 };
  registro.cuenta++;
  if (registro.cuenta >= MAX_INTENTOS) registro.hasta = Date.now() + BLOQUEO_MS;
  intentos.set(clave, registro);
}

// Crea una sesión nueva para el usuario
function abrirSesion(req, res, usuarioId, codigo) {
  req.session.regenerate((error) => {
    if (error) return res.status(500).json({ error: 'No se pudo iniciar la sesión' });
    req.session.usuarioId = usuarioId;
    res.status(codigo).json({ usuario: Usuario.buscarPorId(usuarioId) });
  });
}

exports.registro = (req, res) => {
  const nombre = String(req.body.nombre || '').trim();
  const correo = String(req.body.correo || '').trim().toLowerCase();
  const telefono = String(req.body.telefono || '').trim();
  const contrasena = String(req.body.contrasena || '');

  if (nombre.length < 2 || nombre.length > 80) {
    return res.status(400).json({ error: 'Escribe tu nombre completo' });
  }
  if (!REGEX_CORREO.test(correo)) {
    return res.status(400).json({ error: 'El correo no es válido' });
  }
  if (telefono && !REGEX_TELEFONO.test(telefono)) {
    return res.status(400).json({ error: 'El teléfono no es válido' });
  }
  if (contrasena.length < 8 || contrasena.length > 72) {
    return res.status(400).json({ error: 'La contraseña debe tener entre 8 y 72 caracteres' });
  }
  if (Usuario.buscarPorCorreo(correo)) {
    return res.status(409).json({ error: 'Ese correo ya está registrado' });
  }

  const contrasenaHash = bcrypt.hashSync(contrasena, 10);
  const id = Usuario.crear({ nombre, correo, telefono, contrasenaHash });
  abrirSesion(req, res, id, 201);
};

exports.login = (req, res) => {
  const correo = String(req.body.correo || '').trim().toLowerCase();
  const contrasena = String(req.body.contrasena || '');
  const clave = req.ip + '|' + correo;

  if (estaBloqueado(clave)) {
    return res.status(429).json({ error: 'Demasiados intentos. Intenta de nuevo en 15 minutos' });
  }

  const usuario = Usuario.buscarPorCorreo(correo);
  const correcto = usuario && bcrypt.compareSync(contrasena, usuario.contrasena);

  if (!correcto) {
    registrarFallo(clave);
    return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
  }

  intentos.delete(clave);
  abrirSesion(req, res, usuario.id, 200);
};

// Devuelve el usuario con sesión iniciada, o null si no hay
exports.yo = (req, res) => {
  const usuario = req.session.usuarioId ? Usuario.buscarPorId(req.session.usuarioId) : null;
  res.json({ usuario: usuario || null });
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
};