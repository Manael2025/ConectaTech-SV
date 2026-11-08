// Pruebas rápidas de la tienda. El servidor debe estar corriendo (npm run dev).
const BASE = process.env.BASE_URL || 'http://localhost:3000';
let fallos = 0;
let total = 0;

function pedir(ruta, opciones = {}) {
  return fetch(BASE + ruta, { redirect: 'manual', ...opciones });
}

function enviarJson(ruta, datos) {
  return pedir(ruta, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });
}

async function probar(nombre, funcion) {
  total++;
  try {
    const bien = await funcion();
    console.log((bien ? '  ✔ ' : '  ✘ ') + nombre);
    if (!bien) fallos++;
  } catch (error) {
    console.log('  ✘ ' + nombre + '  (' + error.message + ')');
    fallos++;
  }
}

async function ejecutar() {
  console.log('\nPruebas de ConectaTech SV en ' + BASE + '\n');

  console.log('Tienda');
  await probar('El servidor responde', async () => (await pedir('/api/salud')).status === 200);
  await probar('Hay categorías', async () => {
    const datos = await (await pedir('/api/categorias')).json();
    return Array.isArray(datos) && datos.length > 0;
  });
  await probar('Hay productos con precio final', async () => {
    const datos = await (await pedir('/api/productos')).json();
    return Array.isArray(datos) && datos.length > 0 && datos.every(p => typeof p.precio_final === 'number');
  });
  await probar('Un producto que no existe da 404', async () => (await pedir('/api/productos/999999')).status === 404);
  await probar('Una dirección de la API que no existe da 404', async () => (await pedir('/api/no-existe')).status === 404);

  console.log('\nSeguridad');
  await probar('El panel de administración (datos) exige sesión', async () => (await pedir('/api/admin/dashboard')).status === 401);
  await probar('El panel de administración (página) manda al login', async () => {
    const r = await pedir('/admin/dashboard.html');
    return r.status === 302 && String(r.headers.get('location')).includes('/login.html');
  });
  await probar('Los pedidos exigen sesión', async () => (await pedir('/api/pedidos')).status === 401);
  await probar('Un pedido ajeno no se puede ver sin sesión', async () => (await pedir('/api/pedidos/1')).status === 401);
  await probar('Login con contraseña incorrecta da 401', async () =>
    (await enviarJson('/api/auth/login', { correo: 'prueba@ejemplo.com', contrasena: 'incorrecta123' })).status === 401);
  await probar('El registro rechaza una contraseña corta', async () =>
    (await enviarJson('/api/auth/registro', { nombre: 'Prueba', correo: 'prueba@ejemplo.com', contrasena: '123' })).status === 400);
  await probar('El formulario de contacto rechaza datos vacíos', async () =>
    (await enviarJson('/api/contacto', {})).status === 400);
  await probar('Un intento de inyección SQL en el orden no rompe nada', async () => {
    const r = await pedir('/api/productos?orden=' + encodeURIComponent('precio_asc; DROP TABLE productos;--'));
    return r.status === 200 && Array.isArray(await r.json());
  });
  await probar('Un intento de inyección SQL en la búsqueda no rompe nada', async () => {
    const r = await pedir('/api/productos?buscar=' + encodeURIComponent("' OR 1=1 --"));
    return r.status === 200 && Array.isArray(await r.json());
  });
  await probar('El servidor no revela que usa Express', async () =>
    (await pedir('/api/salud')).headers.get('x-powered-by') === null);

  console.log('\n' + (total - fallos) + ' de ' + total + ' pruebas correctas.');
  if (fallos > 0) process.exitCode = 1;
}

ejecutar();