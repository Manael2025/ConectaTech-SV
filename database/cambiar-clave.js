const readline = require('readline');
const bcrypt = require('bcryptjs');
const db = require('../src/config/db');

// Sin argumento cambia la del administrador; también sirve para cualquier otro correo
const correo = (process.argv[2] || 'admin@conectatech.sv').trim().toLowerCase();
const usuario = db.prepare('SELECT id FROM usuarios WHERE correo = ?').get(correo);

if (!usuario) {
  console.error('No existe ningún usuario con el correo ' + correo);
  process.exit(1);
}

const lector = readline.createInterface({ input: process.stdin, output: process.stdout });

lector.question('Nueva contraseña para ' + correo + ' (8 a 72 caracteres): ', (clave) => {
  lector.close();

  if (clave.length < 8 || clave.length > 72) {
    console.error('La contraseña debe tener entre 8 y 72 caracteres.');
    process.exit(1);
  }

  db.prepare('UPDATE usuarios SET contrasena = ? WHERE id = ?')
    .run(bcrypt.hashSync(clave, 10), usuario.id);
  console.log('Contraseña actualizada para ' + correo + '.');
  console.log('Escribe "cls" para borrar la pantalla, porque la contraseña quedó visible.');
});