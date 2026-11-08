CREATE TABLE IF NOT EXISTS categorias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT
);

CREATE TABLE IF NOT EXISTS productos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio REAL NOT NULL,
  precio_oferta REAL,
  en_oferta INTEGER NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  imagen TEXT,
  categoria_id INTEGER NOT NULL,
  activo INTEGER NOT NULL DEFAULT 1,
  creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);

CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  correo TEXT NOT NULL UNIQUE,
  telefono TEXT,
  contrasena TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'cliente',
  creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pedidos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER,
  nombre_cliente TEXT NOT NULL,
  correo TEXT NOT NULL,
  telefono TEXT NOT NULL,
  departamento TEXT,
  municipio TEXT,
  direccion TEXT,
  tipo_entrega TEXT NOT NULL,
  metodo_pago TEXT NOT NULL,
  notas TEXT,
  subtotal REAL NOT NULL,
  descuento REAL NOT NULL DEFAULT 0,
  envio REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS detalle_pedido (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pedido_id INTEGER NOT NULL,
  producto_id INTEGER NOT NULL,
  nombre_producto TEXT NOT NULL,
  precio_unitario REAL NOT NULL,
  cantidad INTEGER NOT NULL,
  subtotal REAL NOT NULL,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
  FOREIGN KEY (producto_id) REFERENCES productos(id)
);

CREATE TABLE IF NOT EXISTS mensajes_contacto (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  correo TEXT NOT NULL,
  telefono TEXT,
  asunto TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  leido INTEGER NOT NULL DEFAULT 0,
  creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cupones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo TEXT NOT NULL UNIQUE,
  porcentaje INTEGER NOT NULL,
  activo INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS resenas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  producto_id INTEGER NOT NULL,
  usuario_id INTEGER NOT NULL,
  calificacion INTEGER NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
  comentario TEXT,
  creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (producto_id) REFERENCES productos(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_resena_unica ON resenas (producto_id, usuario_id);