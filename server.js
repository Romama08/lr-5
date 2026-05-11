const express = require('express');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'build')));

const authenticate = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Немає токена" });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = parseInt(decoded.userId);
        next();
    } catch (e) {
        res.status(403).json({ error: "Токен недійсний" });
    }
};

// --- API ROUTES ---

app.post('/api/auth/register', async (req, res) => {
    const { email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({ data: { email, password: hashedPassword } });
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({ token, user: { email: user.email } });
    } catch (e) { res.status(400).json({ error: "Користувач вже існує" }); }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ error: "Помилка входу" });
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { email: user.email } });
    } catch (e) { res.status(500).json({ error: "Помилка сервера" }); }
});

app.get('/api/bookings', authenticate, async (req, res) => {
    try {
        const bookings = await prisma.booking.findMany({
            where: { userId: req.userId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(bookings);
    } catch (e) { res.status(500).json({ error: "Помилка завантаження" }); }
});

app.post('/api/bookings', authenticate, async (req, res) => {
    const { title, date, location, quantity, totalPrice } = req.body;
    try {
        const newBooking = await prisma.booking.create({
            data: { title, date, location, quantity: parseInt(quantity), totalPrice: parseInt(totalPrice), userId: req.userId }
        });
        res.status(201).json(newBooking);
    } catch (e) { res.status(400).json({ error: "Помилка бронювання" }); }
});

// ДОДАНО: ВИДАЛЕННЯ КВИТКА (щоб не було помилки при натисканні "Скасувати")
app.delete('/api/bookings/:id', authenticate, async (req, res) => {
    try {
        await prisma.booking.delete({
            where: { id: parseInt(req.params.id), userId: req.userId }
        });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Не вдалося видалити" }); }
});

app.get('/api/reviews/:eventId', async (req, res) => {
    try {
        const reviews = await prisma.review.findMany({
            where: { eventId: parseInt(req.params.eventId) },
            include: { user: { select: { email: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(reviews);
    } catch (e) { res.status(500).json({ error: "Помилка БД" }); }
});

app.post('/api/reviews', authenticate, async (req, res) => {
    try {
        const review = await prisma.review.create({
            data: { eventId: parseInt(req.body.eventId), rating: parseInt(req.body.rating), comment: req.body.comment, userId: req.userId }
        });
        res.status(201).json(review);
    } catch (e) { res.status(400).json({ error: "Помилка відгуку" }); }
});

// --- FRONTEND ROUTING (Твій варіант /.*/ з безпечною перевіркою) ---

app.get(/.*/, (req, res) => {
    // ЯКЩО запит іде до API, але він не був оброблений вище - зупиняємось
    // Це запобігає віддачі HTML замість даних (помилка 404 на Render)
    if (req.url.startsWith('/api')) {
        return res.status(404).json({ error: "API route not found" });
    }
    // Для всього іншого віддаємо React
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => console.log(`🚀 Сервер: http://localhost:${PORT}`));