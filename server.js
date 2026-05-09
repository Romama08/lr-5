const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Вказуємо шлях до папки build (де лежатиме ваш сайт)
app.use(express.static(path.join(__dirname, 'build')));

// Тестовий маршрут для перевірки
app.get('/api/test', (req, res) => {
    res.json({ message: "Node.js сервер працює!" });
});

// React Router: всі інші запити повертають index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Сервер запущено на: http://localhost:${PORT}`);
});