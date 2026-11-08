# ConectaTech SV

Tienda en línea de accesorios tecnológicos. Proyecto de Laboratorio II (Negocios Digitales).

*Tu tecnología, siempre conectada.*

## Funciones
- Catálogo con categorías, búsqueda, filtros, ofertas y reseñas
- Carrito, checkout con envío por departamento, cupones y dos métodos de pago
- Cuentas de clientes con historial de pedidos
- Panel de administración: dashboard de ventas, productos, pedidos, clientes, cupones, reseñas y mensajes
- Formulario de contacto con protección básica contra spam

## Tecnologías
Node.js, Express, SQLite (better-sqlite3), HTML, CSS y JavaScript.

## Cómo ejecutarla
Requisito: Node.js 20 o superior.

1. Instalar dependencias: `npm install`
2. Crear un archivo `.env` en la raíz con:
```
   PORT=3000
   SESSION_SECRET=una-clave-larga-y-aleatoria-de-al-menos-32-caracteres
   NODE_ENV=development
```
3. Crear la base de datos con productos y administrador: `npm run db:init`
4. (Opcional) Cargar datos de demostración: `npm run db:demo`
5. Definir la contraseña del administrador: `npm run admin:clave`
6. Iniciar: `npm start` y abrir http://localhost:3000

El panel de administración está en `/admin/dashboard.html` (cuenta: admin@conectatech.sv).

## Pruebas
Con el servidor encendido, en otra terminal: `npm run prueba`

## Estructura
- `server.js`: arranque del servidor
- `src/`: rutas, controladores, modelos y seguridad (backend)
- `database/`: tablas, datos iniciales y scripts
- `public/`: páginas, estilos, scripts e imágenes (frontend)
- `pruebas/`: pruebas automáticas

## Integrantes
- [Nombre completo]
- [Nombre completo]
- [Nombre completo]
- [Nombre completo]