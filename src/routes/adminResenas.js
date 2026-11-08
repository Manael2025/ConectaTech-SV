const router = require('express').Router();
const controlador = require('../controllers/adminResenasController');

router.get('/', controlador.listar);
router.delete('/:id', controlador.eliminar);

module.exports = router;