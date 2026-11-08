const router = require('express').Router();
const controlador = require('../controllers/authController');

router.post('/registro', controlador.registro);
router.post('/login', controlador.login);
router.post('/logout', controlador.logout);
router.get('/yo', controlador.yo);

module.exports = router;