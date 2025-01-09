const express = require('express');
const path = require('path');
const axios = require('axios');
const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit');
const fs = require('fs');

const app = express();

// Configurar middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Armazenamento temporário de eventos (substituir por banco de dados em produção)
const eventos = {};

// Rota para consultar CNPJ
app.get('/consultar-cnpj/:cnpj', async (req, res) => {
    const cnpj = req.params.cnpj;

    try {
        const response = await axios.get(`https://www.receitaws.com.br/v1/cnpj/${cnpj}`);
        res.json(response.data);
    } catch (error) {
        console.error('Erro ao consultar CNPJ:', error.response?.data || error.message);
        res.status(error.response?.status || 500).send('Erro ao consultar CNPJ');
    }
});

app.post('/salvar-evento', (req, res) => {
  const { proposalNumber } = req.body;

  if (!proposalNumber) {
      return res.status(400).send('Número da Proposta é obrigatório.');
  }

  eventos[proposalNumber] = req.body;
  console.log('Evento salvo:', eventos[proposalNumber]);
  res.status(200).send('Evento salvo com sucesso!');
});

app.get('/municipios/:codigo', (req, res) => {
  const data = {
      idh: "0.765",
      fonte: "PNUD",
      anoReferencia: 2010,
      populacao: 12000,
      fontePopulacao: "IBGE",
      anoPopulacao: 2021
  };
  res.json(data);
});

// Rota para carregar evento
app.get('/carregar-evento/:proposalNumber', (req, res) => {
  const { proposalNumber } = req.params;

  if (!eventos[proposalNumber]) {
      return res.status(404).send('Evento não encontrado.');
  }

  res.json(eventos[proposalNumber]);
});

// Rota para gerar o PDF
app.post('/gerar-pdf', (req, res) => {
  const data = req.body;

  const doc = new PDFDocument();
  const fileName = `PTP_${data.proposalNumber || 'evento'}.pdf`;
  const outputPath = path.join(__dirname, fileName);

  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  // Adicionar conteúdo ao PDF
  doc.fontSize(20).text('Projeto Técnico Pedagógico', { align: 'center' });
  doc.moveDown();
  Object.entries(data).forEach(([key, value]) => {
      doc.fontSize(12).text(`${key}: ${value}`);
  });
  doc.end();

  stream.on('finish', () => {
      res.download(outputPath, () => {
          fs.unlinkSync(outputPath); // Remover arquivo após download
      });
  });
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
