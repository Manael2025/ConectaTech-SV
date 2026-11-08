require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const session = require('express-session');
const path = require('path');
const { protegerPaginaAdmin } = require('./src/middlewares/auth');

// Sin una clave secreta decente, las sesiones no son seguras
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  console.error('Falta SESSION_SECRET en .env (mínimo 32 caracteres). Mira el Paso 2 de la Fase 10.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;
const ES_PRODUCCION = process.env.NODE_ENV === 'production';

// Detrás de un servicio de hosting (que usa HTTPS), Express debe confiar en el proxy
if (ES_PRODUCCION) app.set('trust proxy', 1);

// Cabeceras de seguridad. La política de contenido (CSP) queda desactivada
// porque las páginas usan algunos scripts y atributos en línea.
app.use(helmet({ contentSecurityPolicy: false }));

// Permite leer datos JSON y de formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sesiones de usuario
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,                    // el JavaScript de la página no puede leerla
    sameSite: 'lax',                   // ayuda a evitar ataques desde otros sitios
    secure: ES_PRODUCCION,             // solo viaja por HTTPS cuando está publicada
    maxAge: 1000 * 60 * 60 * 24 * 7    // dura 7 días
  }
}));

// Evita un error 404 en cada visita (los navegadores piden este archivo)
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Las páginas de /admin solo se entregan a administradores (debe ir ANTES de static)
app.use('/admin', protegerPaginaAdmin);

// Entrega los archivos de la carpeta public
app.use(express.static(path.join(__dirname, 'public')));

// Ruta de prueba
app.get('/api/salud', (req, res) => {
  res.json({ ok: true, tienda: 'ConectaTech SV' });
});

// Rutas de la API
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/categorias', require('./src/routes/categorias'));
app.use('/api/productos', require('./src/routes/productos'));
app.use('/api/productos', require('./src/routes/resenas'));
app.use('/api/pedidos', require('./src/routes/pedidos'));
app.use('/api/contacto', require('./src/routes/contacto'));
app.use('/api/admin', require('./src/routes/admin'));

// Cualquier otra dirección /api desconocida
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Arranca el servidor
app.listen(PORT, () => {
  console.log(`Servidor listo en http://localhost:${PORT}`);
});