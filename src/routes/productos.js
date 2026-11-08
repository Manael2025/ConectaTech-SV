const router = require('express').Router();
const controlador = require('../controllers/productosController');

router.get('/', controlador.listar);
router.get('/:id', controlador.detalle);

module.exports = router;