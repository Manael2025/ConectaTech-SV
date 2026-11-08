const router = require('express').Router();
const controlador = require('../controllers/contactoController');

router.post('/', controlador.enviar);

module.exports = router;