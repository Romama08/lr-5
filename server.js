const express = require('express');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'build')));

app.get('/api/reviews/:eventId', async (req, res) => {
    const eventId = parseInt(req.params.eventId);
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    if (isNaN(eventId)) {
        return res.status(400).json({ error: "Некоректний ID події" });
    }

    try {
        const [reviews, totalCount, agg] = await Promise.all([
            prisma.review.findMany({ 
                where: { eventId }, 
                skip, 
                take: limit, 
                orderBy: { createdAt: 'desc' } 
            }),
            prisma.review.count({ where: { eventId } }),
            prisma.review.aggregate({ 
                where: { eventId }, 
                _avg: { rating: true } 
            })
        ]);

        res.json({
            reviews,
            averageRating: agg._avg.rating ? agg._avg.rating.toFixed(1) : "0.0",
            totalPages: Math.ceil(totalCount / limit) || 1
        });
    } catch (e) {
        console.error("Помилка БД:", e);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/reviews', async (req, res) => {
    const { eventId, rating, comment } = req.body;

    if (!eventId || !rating) {
        return res.status(400).json({ error: "Відсутні обов'язкові поля" });
    }

    try {
        const review = await prisma.review.create({
            data: { 
                eventId: parseInt(eventId), 
                rating: parseInt(rating), 
                comment: comment || "" 
            }
        });
        res.status(201).json(review);
    } catch (e) {
        console.error("Помилка збереження:", e);
        res.status(400).json({ error: e.message });
    }
});

app.get(/^(?!\/api).+/, (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.use('/api', (req, res) => {
    res.status(404).json({ error: "API endpoint не знайдено" });
});

app.listen(PORT, () => {
    console.log(`🚀 Сервер запущено: http://localhost:${PORT}`);
});