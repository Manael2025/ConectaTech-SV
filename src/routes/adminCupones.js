const router = require('express').Router();
const controlador = require('../controllers/adminCuponesController');

router.get('/', controlador.listar);
router.post('/', controlador.crear);
router.patch('/:id/activo', controlador.activar);
router.delete('/:id', controlador.eliminar);

module.exports = router;