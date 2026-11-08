const router = require('express').Router();
const { requiereAdmin } = require('../middlewares/auth');
const controlador = require('../controllers/adminController');

// Todo lo de /api/admin exige ser administrador
router.use(requiereAdmin);

router.get('/dashboard', controlador.dashboard);
router.get('/clientes', controlador.clientes);
router.use('/productos', require('./adminProductos'));
router.use('/pedidos', require('./adminPedidos'));
router.use('/mensajes', require('./adminMensajes'));
router.use('/cupones', require('./adminCupones'));
router.use('/resenas', require('./adminResenas'));

module.exports = router;