const router = require('express').Router();
const controlador = require('../controllers/adminMensajesController');

router.get('/', controlador.listar);
router.patch('/:id/leido', controlador.marcarLeido);
router.delete('/:id', controlador.eliminar);

module.exports = router;