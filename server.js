const express = require('express');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();

// Порт для сервера (Render/Railway зазвичай дають свій, тому використовуємо змінну оточення)
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123';

// --- Middleware ---
app.use(cors());
app.use(express.json());

// Роздача статичних файлів React після npm run build
app.use(express.static(path.join(__dirname, 'build')));

// --- Middleware для авторизації (JWT) ---
const authenticate = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: "Доступ заборонено (немає токена)" });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (e) {
        res.status(403).json({ error: "Недійсний або прострочений токен" });
    }
};

// --- AUTH ROUTES ---

// Реєстрація користувача
app.post('/api/auth/register', async (req, res) => {
    const { email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { email, password: hashedPassword }
        });
        
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({ token, user: { email: user.email } });
    } catch (e) {
        console.error(e);
        res.status(400).json({ error: "Користувач із таким email вже існує" });
    }
});

// Вхід користувача
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(401).json({ error: "Користувача не знайдено" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: "Невірний пароль" });

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { email: user.email } });
    } catch (e) {
        res.status(500).json({ error: "Помилка сервера" });
    }
});

// --- BOOKINGS ROUTES ---

// Отримати квитки поточного користувача
app.get('/api/bookings', authenticate, async (req, res) => {
    try {
        const bookings = await prisma.booking.findMany({
            where: { userId: req.userId }
        });
        res.json(bookings);
    } catch (e) {
        res.status(500).json({ error: "Не вдалося завантажити квитки" });
    }
});

// Створити нове бронювання
app.post('/api/bookings', authenticate, async (req, res) => {
    const { title, date, location, quantity, totalPrice } = req.body;
    try {
        const newBooking = await prisma.booking.create({
            data: {
                title,
                date,
                location,
                quantity: parseInt(quantity),
                totalPrice: parseInt(totalPrice),
                userId: req.userId
            }
        });
        res.status(201).json(newBooking);
    } catch (e) {
        res.status(400).json({ error: "Помилка при бронюванні" });
    }
});

// --- REVIEWS ROUTES ---

// Отримати відгуки для події
app.get('/api/reviews/:eventId', async (req, res) => {
    const eventId = parseInt(req.params.eventId);
    try {
        const reviews = await prisma.review.findMany({
            where: { eventId },
            include: { user: { select: { email: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(reviews);
    } catch (e) {
        res.status(500).json({ error: "Помилка БД" });
    }
});

// Додати новий відгук (тільки для авторизованих)
app.post('/api/reviews', authenticate, async (req, res) => {
    const { eventId, rating, comment } = req.body;
    try {
        const review = await prisma.review.create({
            data: {
                eventId: parseInt(eventId),
                rating: parseInt(rating),
                comment,
                userId: req.userId
            }
        });
        res.status(201).json(review);
    } catch (e) {
        res.status(400).json({ error: "Не вдалося зберегти відгук" });
    }
});

// --- FRONTEND ROUTING ---

// Важливо: цей блок має бути останнім серед маршрутів
// Будь-який запит, що не починається з /api, віддає React-додаток
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущено на: http://localhost:${PORT}`);
});