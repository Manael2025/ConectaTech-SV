const router = require('express').Router();
const { requiereLogin } = require('../middlewares/auth');
const controlador = require('../controllers/resenasController');

router.get('/:id/resenas', controlador.listar);
router.post('/:id/resenas', requiereLogin, controlador.crear);

module.exports = router;