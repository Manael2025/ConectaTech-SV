const SECCIONES_ADMIN = [
  { href: '/admin/dashboard.html', texto: 'Dashboard' },
  { href: '/admin/productos.html', texto: 'Productos' },
  { href: '/admin/pedidos.html', texto: 'Pedidos' },
  { href: '/admin/clientes.html', texto: 'Clientes' },
  { href: '/admin/cupones.html', texto: 'Cupones' },
  { href: '/admin/resenas.html', texto: 'Reseñas' },
  { href: '/admin/mensajes.html', texto: 'Mensajes' }
];

function dibujarMenuAdmin() {
  const menu = document.getElementById('menu-admin');
  if (!menu) return;

  menu.innerHTML =
    '<h2>Panel admin</h2>' +
    SECCIONES_ADMIN.map(s =>
      `<a href="${s.href}" class="${location.pathname === s.href ? 'activo' : ''}">${s.texto}</a>`
    ).join('') +
    '<a href="/" class="volver">Ver tienda</a>';
}

document.addEventListener('DOMContentLoaded', dibujarMenuAdmin);

async function llamarApi(metodo, url, datos) {
  const opciones = { method: metodo, headers: { 'Content-Type': 'application/json' } };
  if (datos !== undefined) opciones.body = JSON.stringify(datos);

  const respuesta = await fetch(url, opciones);
  const cuerpo = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) throw new Error(cuerpo.error || 'Error ' + respuesta.status);
  return cuerpo;
}