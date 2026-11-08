const router = require('express').Router();
const controlador = require('../controllers/categoriasController');

router.get('/', controlador.listar);

module.exports = router;