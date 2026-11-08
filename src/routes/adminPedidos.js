const router = require('express').Router();
const controlador = require('../controllers/adminPedidosController');

router.get('/', controlador.listar);
router.get('/:id', controlador.obtener);
router.patch('/:id/estado', controlador.cambiarEstado);

module.exports = router;