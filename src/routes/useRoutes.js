const express = require('express');
const router = express.Router();

// Definição das rotas
router.get('/', (req, res) => {
    res.send('index');
});

router.get('/evento-formulario', (req, res) => {
    res.render('evento-formulario');
  });
  

// Exporte o router para ser usado no app.js
module.exports = router;