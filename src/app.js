const express = require('express');
const path = require('path');
const axios = require('axios');
const app = express();

// Configurar pasta de arquivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

app.get('/consultar-cnpj/:cnpj', async (req, res) => {
  const cnpj = req.params.cnpj;

  try {
      const response = await axios.get(`https://www.receitaws.com.br/v1/cnpj/${cnpj}`);
      console.log('Resposta completa da API:', response.data); // Log no console
      res.json(response.data);
  } catch (error) {
      console.error('Erro ao consultar CNPJ:', error.response?.data || error.message);
      res.status(error.response?.status || 500).send('Erro ao consultar CNPJ');
  }
});

// Configurar mecanismo de visualização
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Rota para a página inicial
app.get('/', (req, res) => {
    res.render('index');
});
// Rota para o formulário de evento
app.get('/evento-formulario', (req, res) => {
  res.render('evento-formulario');
});

// Iniciar o servidor
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});