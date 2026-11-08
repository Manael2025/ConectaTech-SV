const bcrypt = require('bcryptjs');
const db = require('../src/config/db');
const Pedido = require('../src/models/pedido');
const AdminPedidos = require('../src/models/adminPedidos');

const DOMINIO = '@demo.conectatech.sv';
const CLAVE_DEMO = 'Demo1234!';

// No se ejecuta dos veces: así no se duplican los datos
const yaExisten = db.prepare('SELECT COUNT(*) AS n FROM usuarios WHERE correo LIKE ?').get('%' + DOMINIO).n;
if (yaExisten > 0) {
  console.log('Los datos de demostración ya existen. No se hizo nada.');
  process.exit(0);
}

// Productos, por el nombre con el que se cargaron
const P = {
  bluetooth: 'Audífonos inalámbricos Bluetooth',
  cableAud: 'Audífonos con cable y micrófono',
  cargador: 'Cargador rápido USB-C 20W',
  cable: 'Cable USB-C a USB-C (1 m)',
  funda: 'Funda protectora para celular',
  vidrio: 'Protector de pantalla de vidrio templado',
  mouse: 'Mouse inalámbrico',
  soporte: 'Soporte ajustable para laptop'
};

const CLIENTES = [
  { nombre: 'María Hernández', correo: 'maria' + DOMINIO, telefono: '7000-0001' },
  { nombre: 'Carlos Martínez', correo: 'carlos' + DOMINIO, telefono: '7000-0002' },
  { nombre: 'Ana Gómez', correo: 'ana' + DOMINIO, telefono: '7000-0003' },
  { nombre: 'José Rivera', correo: 'jose' + DOMINIO, telefono: '7000-0004' }
];

// cliente = posición en CLIENTES; hace = días y horas atrás
const PEDIDOS = [
  { cliente: 0, items: [['bluetooth', 1], ['funda', 1]], entrega: 'domicilio', depto: 'San Miguel', municipio: 'San Miguel', direccion: 'Colonia Ciudad Jardín, pasaje 3, casa 12', pago: 'contra_entrega', cupon: '', estado: 'entregado', dias: 6, horas: 3 },
  { cliente: 1, items: [['cargador', 2], ['cable', 1]], entrega: 'domicilio', depto: 'Usulután', municipio: 'Usulután', direccion: 'Barrio El Calvario, calle principal, casa 8', pago: 'transferencia', cupon: 'BIENVENIDO10', estado: 'entregado', dias: 5, horas: 5 },
  { cliente: 2, items: [['mouse', 1], ['soporte', 1]], entrega: 'retiro', pago: 'contra_entrega', cupon: '', estado: 'entregado', dias: 5, horas: 1 },
  { cliente: 3, items: [['bluetooth', 2]], entrega: 'domicilio', depto: 'La Unión', municipio: 'La Unión', direccion: 'Colonia Pasaquina, casa 21', pago: 'transferencia', cupon: '', estado: 'entregado', dias: 4, horas: 6 },
  { cliente: 0, items: [['vidrio', 2], ['funda', 2]], entrega: 'domicilio', depto: 'San Miguel', municipio: 'San Miguel', direccion: 'Colonia Ciudad Jardín, pasaje 3, casa 12', pago: 'contra_entrega', cupon: 'ESTUDIANTE5', estado: 'enviado', dias: 3, horas: 4 },
  { cliente: 1, items: [['cableAud', 1], ['cable', 2]], entrega: 'domicilio', depto: 'San Salvador', municipio: 'San Salvador', direccion: 'Colonia Escalón, calle 5, apartamento 3B', pago: 'transferencia', cupon: '', estado: 'confirmado', dias: 3, horas: 2 },
  { cliente: 2, items: [['cargador', 1], ['mouse', 1]], entrega: 'domicilio', depto: 'Morazán', municipio: 'San Francisco Gotera', direccion: 'Barrio El Centro, frente al parque', pago: 'contra_entrega', cupon: '', estado: 'cancelado', dias: 2, horas: 5 },
  { cliente: 3, items: [['soporte', 1], ['mouse', 1], ['cable', 1]], entrega: 'retiro', pago: 'transferencia', cupon: 'BIENVENIDO10', estado: 'confirmado', dias: 2, horas: 1 },
  { cliente: 0, items: [['bluetooth', 1]], entrega: 'domicilio', depto: 'Santa Ana', municipio: 'Santa Ana', direccion: 'Colonia Santa Lucía, pasaje 4, casa 15', pago: 'contra_entrega', cupon: '', estado: 'pendiente', dias: 1, horas: 6 },
  { cliente: 1, items: [['funda', 1], ['vidrio', 1]], entrega: 'retiro', pago: 'contra_entrega', cupon: '', estado: 'pendiente', dias: 1, horas: 2 },
  { cliente: 2, items: [['cargador', 3]], entrega: 'domicilio', depto: 'San Miguel', municipio: 'San Miguel', direccion: 'Residencial Los Almendros, casa 30', pago: 'contra_entrega', cupon: '', estado: 'pendiente', dias: 0, horas: 3 },
  { cliente: 3, items: [['bluetooth', 1], ['cableAud', 1], ['cargador', 1]], entrega: 'domicilio', depto: 'Usulután', municipio: 'Santiago de María', direccion: 'Barrio San Antonio, casa 5', pago: 'transferencia', cupon: '', estado: 'pendiente', dias: 0, horas: 1 }
];

// Para llegar a cada estado se siguen los mismos pasos que daría el administrador
const RUTA = {
  pendiente: [],
  confirmado: ['confirmado'],
  enviado: ['confirmado', 'enviado'],
  entregado: ['confirmado', 'enviado', 'entregado'],
  cancelado: ['cancelado']
};

const RESENAS = [
  { cliente: 0, producto: 'bluetooth', calificacion: 5, comentario: 'Excelente sonido y la batería me dura todo el día de clases.', dias: 3 },
  { cliente: 0, producto: 'funda', calificacion: 4, comentario: 'Protege bien el celular y se siente resistente.', dias: 3 },
  { cliente: 1, producto: 'cargador', calificacion: 5, comentario: 'Carga rápido de verdad. Muy buen precio.', dias: 2 },
  { cliente: 2, producto: 'mouse', calificacion: 4, comentario: 'Cómodo y sin retrasos. Cumple muy bien.', dias: 2 },
  { cliente: 3, producto: 'bluetooth', calificacion: 5, comentario: 'Llegaron rápido y funcionan perfecto.', dias: 1 }
];

const MENSAJES = [
  { nombre: 'Laura Pérez', correo: 'laura' + DOMINIO, asunto: '¿Hacen envíos a Morazán?', mensaje: 'Hola, quisiera saber si hacen envíos a Morazán y cuánto tardaría en llegar un pedido. Gracias.', leido: 0, dias: 0 },
  { nombre: 'Roberto Flores', correo: 'roberto' + DOMINIO, asunto: '¿Tienen garantía los audífonos?', mensaje: 'Buenas tardes, ¿los audífonos Bluetooth tienen alguna garantía en caso de que fallen?', leido: 0, dias: 1 },
  { nombre: 'Karla Díaz', correo: 'karla' + DOMINIO, asunto: 'Gracias por mi pedido', mensaje: 'Solo quería agradecer, mi pedido llegó en perfecto estado y antes de lo esperado.', leido: 1, dias: 3 }
];

function idProducto(clave) {
  const fila = db.prepare('SELECT id FROM productos WHERE nombre = ?').get(P[clave]);
  return fila ? fila.id : null;
}

// ----- Clientes -----
const hash = bcrypt.hashSync(CLAVE_DEMO, 10);
const insertarUsuario = db.prepare(
  'INSERT INTO usuarios (nombre, correo, telefono, contrasena, rol) VALUES (?, ?, ?, ?, ?)'
);
const usuarios = CLIENTES.map(c => ({
  ...c,
  id: Number(insertarUsuario.run(c.nombre, c.correo, c.telefono, hash, 'cliente').lastInsertRowid)
}));

// ----- Pedidos -----
let creados = 0;
for (const d of PEDIDOS) {
  const u = usuarios[d.cliente];
  const items = d.items
    .map(([clave, cantidad]) => ({ id: idProducto(clave), cantidad }))
    .filter(i => i.id !== null);

  try {
    if (items.length === 0) throw new Error('los productos de este pedido ya no existen');

    const id = Pedido.crear(u.id, {
      nombre: u.nombre,
      correo: u.correo,
      telefono: u.telefono,
      departamento: d.entrega === 'retiro' ? null : d.depto,
      municipio: d.entrega === 'retiro' ? null : d.municipio,
      direccion: d.entrega === 'retiro' ? null : d.direccion,
      tipoEntrega: d.entrega,
      metodoPago: d.pago,
      notas: null,
      codigoCupon: d.cupon
    }, items);

    for (const paso of RUTA[d.estado]) AdminPedidos.cambiarEstado(id, paso);

    // Reparte los pedidos en los últimos días
    db.prepare("UPDATE pedidos SET creado_en = datetime('now', ?, ?) WHERE id = ?")
      .run('-' + d.dias + ' days', '-' + d.horas + ' hours', id);
    creados++;
  } catch (error) {
    console.warn('Se omitió un pedido: ' + error.message);
  }
}

// ----- Reseñas -----
let resenas = 0;
for (const r of RESENAS) {
  const productoId = idProducto(r.producto);
  if (!productoId) continue;
  db.prepare(`
    INSERT INTO resenas (producto_id, usuario_id, calificacion, comentario, creado_en)
    VALUES (?, ?, ?, ?, datetime('now', ?))
  `).run(productoId, usuarios[r.cliente].id, r.calificacion, r.comentario, '-' + r.dias + ' days');
  resenas++;
}

// ----- Mensajes -----
for (const m of MENSAJES) {
  db.prepare(`
    INSERT INTO mensajes_contacto (nombre, correo, asunto, mensaje, leido, creado_en)
    VALUES (?, ?, ?, ?, ?, datetime('now', ?))
  `).run(m.nombre, m.correo, m.asunto, m.mensaje, m.leido, '-' + m.dias + ' days');
}

console.log('Datos de demostración creados:');
console.log('  Clientes: ' + usuarios.length + '  |  Pedidos: ' + creados + '  |  Reseñas: ' + resenas + '  |  Mensajes: ' + MENSAJES.length);
console.log('  Cuentas de clientes demo: maria, carlos, ana y jose' + DOMINIO);
console.log('  Contraseña de todas: ' + CLAVE_DEMO);