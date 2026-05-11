import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

function Profile() {
    const [user, setUser] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        if (savedUser && token) {
            setUser(JSON.parse(savedUser));
            fetchBookings(token);
        }
    }, []);
const fetchBookings = async (token) => {
    try {
        const res = await fetch('/api/bookings', { // Шлях має бути ТІЛЬКИ ТАКИМ
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (res.ok) {
            const data = await res.json();
            console.log("Отримані квитки:", data); // Перевір це в консолі F12!
            setBookings(data);
        } else {
            console.error("Сервер повернув помилку:", res.status);
        }
    } catch (error) {
        console.error("Помилка запиту:", error);
    }
};

    // ФУНКЦІЯ СКАСУВАННЯ БРОНЮВАННЯ
    const handleCancelBooking = async (id) => {
        if (!window.confirm("Ви впевнені, що хочете скасувати це бронювання?")) return;

        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/bookings/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                // Видаляємо квиток зі списку на екрані
                setBookings(bookings.filter(b => b.id !== id));
            } else {
                alert("Не вдалося скасувати бронювання на сервері");
            }
        } catch (error) {
            console.error("Помилка при скасуванні:", error);
        }
    };

    const handleAuthAction = async (e) => {
        e.preventDefault();
        const path = isRegistering ? '/api/auth/register' : '/api/auth/login';
        
        try {
            const res = await fetch(path, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data = await res.json();
            
            if (res.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                setUser(data.user);
                fetchBookings(data.token);
                window.dispatchEvent(new Event('authChange'));
            } else {
                alert(data.error);
            }
        } catch (error) {
            alert("Помилка з'єднання");
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        setUser(null);
        setBookings([]);
        window.dispatchEvent(new Event('authChange'));
    };

    if (!user) {
        return (
            <main className="profile-main">
                <div className="auth-container">
                    <h1>{isRegistering ? 'Реєстрація' : 'Вхід у кабінет'}</h1>
                    <form onSubmit={handleAuthAction} className="auth-form">
                        <div className="input-group">
                            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                        <div className="input-group">
                            <input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </div>
                        <button type="submit" className="confirm-btn">{isRegistering ? 'Створити аккаунт' : 'Увійти'}</button>
                    </form>
                    <p className="auth-toggle" onClick={() => setIsRegistering(!isRegistering)}>
                        {isRegistering ? 'Вже є аккаунт? Увійдіть' : 'Немає аккаунту? Реєстрація'}
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="profile-main">
            <div className="profile-header">
                <img src="https://picsum.photos/seed/user/100/100" alt="Avatar" className="avatar" />
                <div className="profile-user-info">
                    <h1>Мій кабінет</h1>
                    <p>Вітаємо, <strong>{user.email}</strong></p>
                    <button onClick={handleLogout} className="logout-btn">Вийти</button>
                </div>
            </div>

            <h2>Мої квитки</h2>
            <div className="booking-container">
                {bookings.length > 0 ? (
                    bookings.map((booking) => (
                        <div key={booking.id} className="booking-card">
                            <div className="booking-info">
                                <h3>{booking.title}</h3>
                                <p>📅 {booking.date} | 📍 {booking.location}</p>
                                <p>Кількість: {booking.quantity} шт. | <strong>{booking.totalPrice} грн</strong></p>
                            </div>
                            <div className="booking-status">
                                <span className="badge success">Підтверджено</span>
                                {/* ПОВЕРНУТА КНОПКА */}
                                <button 
                                    className="logout-btn cancel-btn" 
                                    onClick={() => handleCancelBooking(booking.id)}
                                    style={{ marginTop: '10px', color: '#ff4d4d', borderColor: '#ff4d4d' }}
                                >
                                    Скасувати
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="empty-msg">
                        <p>У вас немає квитків.</p>
                        <button onClick={() => navigate('/')} className="browse-link" style={{background:'none', border:'none', cursor:'pointer'}}>Переглянути події</button>
                    </div>
                )}
            </div>
        </main>
    );
}

export default Profile;