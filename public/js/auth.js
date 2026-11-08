const formLogin = document.getElementById('form-login');
const formRegistro = document.getElementById('form-registro');
const mensaje = document.getElementById('mensaje');

function mostrarError(texto) {
  mensaje.className = 'mensaje error';
  mensaje.textContent = texto; // textContent evita que se interprete como HTML
}

// A dónde ir después de entrar. Solo se aceptan direcciones internas de la tienda.
function destino() {
  const volver = new URLSearchParams(location.search).get('volver');
  if (volver && volver.startsWith('/') && !volver.startsWith('//')) return volver;
  return '/mi-cuenta.html';
}

// Si venimos del carrito o del pago, conserva el destino en los enlaces
const volverParam = new URLSearchParams(location.search).get('volver');
const enlaceRegistro = document.getElementById('enlace-registro');
if (enlaceRegistro && volverParam) {
  enlaceRegistro.href = '/registro.html?volver=' + encodeURIComponent(volverParam);
}

if (formLogin) {
  formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    const boton = formLogin.querySelector('button');
    boton.disabled = true;
    try {
      await enviarApi('/api/auth/login', {
        correo: formLogin.correo.value,
        contrasena: formLogin.contrasena.value
      });
      location.href = destino();
    } catch (error) {
      mostrarError(error.message);
      boton.disabled = false;
    }
  });
}

if (formRegistro) {
  formRegistro.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (formRegistro.contrasena.value !== formRegistro.confirmar.value) {
      return mostrarError('Las contraseñas no coinciden');
    }

    const boton = formRegistro.querySelector('button');
    boton.disabled = true;
    try {
      await enviarApi('/api/auth/registro', {
        nombre: formRegistro.nombre.value,
        correo: formRegistro.correo.value,
        telefono: formRegistro.telefono.value,
        contrasena: formRegistro.contrasena.value
      });
      location.href = destino();
    } catch (error) {
      mostrarError(error.message);
      boton.disabled = false;
    }
  });
}