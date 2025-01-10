const express = require('express');
const path = require('path');
const axios = require('axios');
const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const cors = require('cors');
const morgan = require('morgan');

const app = express();

// Configuração de diretórios
const TEMP_DIR = path.join(__dirname, '../temp');

// Garante que o diretório "temp" exista
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Configuração de middlewares
app.use(cors()); // Permite solicitações entre origens
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, '../public')));

// Configuração do mecanismo de visualização
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Simulação de banco de dados
const eventos = {};

// Rota para salvar evento
app.post('/salvar-evento', (req, res) => {
    const { proposalNumber } = req.body;

    if (!proposalNumber) {
        return res.status(400).send('Número da Proposta é obrigatório.');
    }

    eventos[proposalNumber] = req.body;
    console.log('Evento salvo:', eventos[proposalNumber]);
    res.status(200).send('Evento salvo com sucesso!');
});

// Rota para carregar evento
app.get('/carregar-evento/:proposalNumber', (req, res) => {
    const { proposalNumber } = req.params;

    if (!eventos[proposalNumber]) {
        return res.status(404).send('Evento não encontrado.');
    }

    res.json(eventos[proposalNumber]);
});

// Rota para consultar CNPJ
app.get('/consultar-cnpj/:cnpj', async (req, res) => {
    const cnpj = req.params.cnpj;

    try {
        const response = await axios.get(`https://www.receitaws.com.br/v1/cnpj/${cnpj}`);
        res.json(response.data);
    } catch (error) {
        console.error('Erro ao consultar CNPJ:', error.message);
        res.status(500).send('Erro ao consultar CNPJ.');
    }
});

// Rota para carregar municípios simulados
app.get('/municipios/:codigo', (req, res) => {
    const data = {
        idh: "0.765",
        fonte: "PNUD",
        anoReferencia: 2010,
        populacao: 12000,
        fontePopulacao: "IBGE",
        anoPopulacao: 2021,
    };
    res.json(data);
});

// Rota para gerar o PDF
app.post('/gerar-pdf', (req, res) => {
    const data = req.body;

    if (!data || !data.proposalNumber) {
        return res.status(400).send('Número da Proposta é obrigatório para gerar o PDF.');
    }

    const pdfDir = path.join(TEMP_DIR, `PTP_${data.proposalNumber}`);
    const pdfPath = path.join(pdfDir, `${new Date().getFullYear()}.pdf`);

    try {
        // Garante que o diretório do PDF exista
        if (!fs.existsSync(pdfDir)) {
            fs.mkdirSync(pdfDir, { recursive: true });
        }

        const doc = new PDFDocument();
        const stream = fs.createWriteStream(pdfPath);

        doc.pipe(stream);

        // Adiciona conteúdo ao PDF
        doc.fontSize(20).text('Projeto Técnico Pedagógico', { align: 'center' });
        doc.moveDown();
        Object.entries(data).forEach(([key, value]) => {
            doc.fontSize(12).text(`${key}: ${value}`);
        });
        doc.end();

        stream.on('finish', () => {
            res.download(pdfPath, () => {
                fs.unlinkSync(pdfPath); // Remove o PDF após o download
                fs.rmdirSync(pdfDir, { recursive: true }); // Remove o diretório do PDF
            });
        });

        stream.on('error', (err) => {
            console.error('Erro ao criar o arquivo PDF:', err.message);
            res.status(500).send('Erro ao gerar o PDF.');
        });
    } catch (error) {
        console.error('Erro ao gerar o PDF:', error.message);
        res.status(500).send('Erro ao gerar o PDF.');
    }
});

// Rota para a página inicial
app.get('/', (req, res) => {
    res.render('index');
});

// Rota para o formulário de evento
app.get('/evento-formulario', (req, res) => {
    res.render('evento-formulario');
});

// Inicialização do servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
