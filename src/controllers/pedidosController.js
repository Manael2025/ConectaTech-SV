const Pedido = require('../models/pedido');
const { TARIFAS, DEPARTAMENTOS, ENVIO_GRATIS_DESDE } = require('../config/envio');

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGEX_TELEFONO = /^[0-9+\-\s]{8,15}$/;
const METODOS_PAGO = ['contra_entrega', 'transferencia'];

function texto(valor, max) {
  return String(valor ?? '').trim().slice(0, max);
}

function responderError(res, error) {
  if (error instanceof Pedido.ErrorPedido) {
    return res.status(400).json({ error: error.message });
  }
  console.error(error); // los errores inesperados solo se ven en la terminal
  res.status(500).json({ error: 'Ocurrió un error. Intenta de nuevo.' });
}

// Datos para llenar el formulario de checkout (público)
exports.opciones = (req, res) => {
  res.json({
    departamentos: DEPARTAMENTOS.map(nombre => ({ nombre: nombre, costo: TARIFAS[nombre] })),
    envioGratisDesde: ENVIO_GRATIS_DESDE
  });
};

// Calcula el resumen sin guardar nada
exports.calcular = (req, res) => {
  try {
    const { items, tipo_entrega, departamento, cupon } = req.body;
    res.json(Pedido.calcular(items, {
      tipoEntrega: tipo_entrega,
      departamento: texto(departamento, 40),
      codigoCupon: texto(cupon, 30)
    }));
  } catch (error) {
    responderError(res, error);
  }
};

// Crea el pedido
exports.crear = (req, res) => {
  try {
    const b = req.body;
    const E = Pedido.ErrorPedido;

    const tipoEntrega = b.tipo_entrega;
    if (!['domicilio', 'retiro'].includes(tipoEntrega)) {
      throw new E('Elige cómo quieres recibir tu pedido');
    }
    if (!METODOS_PAGO.includes(b.metodo_pago)) {
      throw new E('Elige un método de pago');
    }

    const nombre = texto(b.nombre, 80);
    const correo = texto(b.correo, 100).toLowerCase();
    const telefono = texto(b.telefono, 20);
    if (nombre.length < 2) throw new E('Escribe tu nombre completo');
    if (!REGEX_CORREO.test(correo)) throw new E('El correo no es válido');
    if (!REGEX_TELEFONO.test(telefono)) throw new E('El teléfono no es válido');

    let departamento = null;
    let municipio = null;
    let direccion = null;
    if (tipoEntrega === 'domicilio') {
      departamento = texto(b.departamento, 40);
      municipio = texto(b.municipio, 60);
      direccion = texto(b.direccion, 200);
      if (!DEPARTAMENTOS.includes(departamento)) throw new E('Elige el departamento de entrega');
      if (municipio.length < 2) throw new E('Escribe el municipio');
      if (direccion.length < 8) throw new E('Escribe una dirección más completa');
    }

    const pedidoId = Pedido.crear(req.usuario.id, {
      nombre, correo, telefono, departamento, municipio, direccion,
      tipoEntrega: tipoEntrega,
      metodoPago: b.metodo_pago,
      notas: texto(b.notas, 300) || null,
      codigoCupon: texto(b.cupon, 30)
    }, b.items);

    res.status(201).json({ pedido_id: pedidoId });
  } catch (error) {
    responderError(res, error);
  }
};

// Pedidos del usuario con sesión
exports.misPedidos = (req, res) => {
  res.json(Pedido.listarDeUsuario(req.usuario.id));
};

// Detalle de un pedido: solo su dueño o un administrador
exports.detalle = (req, res) => {
  const id = Number(req.params.id);
  const pedido = Number.isInteger(id) ? Pedido.obtener(id) : null;
  const permitido = pedido && (pedido.usuario_id === req.usuario.id || req.usuario.rol === 'admin');

  if (!permitido) {
    // Mismo mensaje para "no existe" y "no es tuyo", para no revelar pedidos ajenos
    return res.status(404).json({ error: 'Pedido no encontrado' });
  }
  res.json(pedido);
};