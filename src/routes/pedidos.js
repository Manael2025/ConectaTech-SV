const router = require('express').Router();
const controlador = require('../controllers/pedidosController');
const { requiereLogin } = require('../middlewares/auth');

// Pública: tarifas y departamentos
router.get('/opciones', controlador.opciones);

// Todo lo de abajo exige sesión iniciada
router.use(requiereLogin);

router.post('/calcular', controlador.calcular);
router.post('/', controlador.crear);
router.get('/', controlador.misPedidos);
router.get('/:id', controlador.detalle);

module.exports = router;