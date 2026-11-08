const Mensaje = require('../models/mensaje');

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGEX_TELEFONO = /^[0-9+\-\s]{8,15}$/;

// Límite: 5 mensajes por hora desde la misma conexión (en memoria)
const LIMITE = 5;
const VENTANA_MS = 60 * 60 * 1000;
const envios = new Map(); // ip -> [momentos de envío]

function superaLimite(ip) {
  const ahora = Date.now();
  const recientes = (envios.get(ip) || []).filter(t => ahora - t < VENTANA_MS);
  if (recientes.length >= LIMITE) {
    envios.set(ip, recientes);
    return true;
  }
  recientes.push(ahora);
  envios.set(ip, recientes);
  return false;
}

function texto(valor, max) {
  return String(valor ?? '').trim().slice(0, max);
}

exports.enviar = (req, res) => {
  const b = req.body || {};

  // Campo trampa: una persona nunca lo llena. Si viene lleno, se finge éxito y se descarta.
  if (texto(b.sitio_web, 50)) {
    return res.status(201).json({ ok: true });
  }

  const nombre = texto(b.nombre, 80);
  const correo = texto(b.correo, 100).toLowerCase();
  const telefono = texto(b.telefono, 20);
  const asunto = texto(b.asunto, 100);
  const mensaje = texto(b.mensaje, 1000);

  if (nombre.length < 2) return res.status(400).json({ error: 'Escribe tu nombre' });
  if (!REGEX_CORREO.test(correo)) return res.status(400).json({ error: 'El correo no es válido' });
  if (telefono && !REGEX_TELEFONO.test(telefono)) {
    return res.status(400).json({ error: 'El teléfono no es válido' });
  }
  if (asunto.length < 3) return res.status(400).json({ error: 'Escribe el asunto' });
  if (mensaje.length < 10) {
    return res.status(400).json({ error: 'El mensaje es muy corto (mínimo 10 caracteres)' });
  }

  if (superaLimite(req.ip)) {
    return res.status(429).json({ error: 'Has enviado varios mensajes seguidos. Intenta de nuevo más tarde' });
  }

  Mensaje.crear({ nombre, correo, telefono, asunto, mensaje });
  res.status(201).json({ ok: true });
};