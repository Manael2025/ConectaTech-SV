const router = require('express').Router();
const controlador = require('../controllers/adminProductosController');

router.get('/', controlador.listar);
router.get('/:id', controlador.obtener);
router.post('/', controlador.crear);
router.put('/:id', controlador.actualizar);
router.patch('/:id/activo', controlador.activar);
router.delete('/:id', controlador.eliminar);

module.exports = router;