import React, { useState, useEffect } from 'react';
import { auth } from '../../firebase-auth';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import './Profile.css';

function Profile() {
  const [bookings, setBookings] = useState([]);
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const storageKey = `userBookings_${currentUser.email}`;
        const saved = JSON.parse(localStorage.getItem(storageKey)) || [];
        setBookings(saved);
      } else {
        setBookings([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleAuthAction = async (e) => {
    e.preventDefault();
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
        alert("Реєстрація успішна!");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      alert(`Помилка: ${error.message}`);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Вийти з системи?')) signOut(auth);
  };

  const handleCancel = (id) => {
    if (window.confirm('Скасувати бронювання?')) {
      const storageKey = `userBookings_${user.email}`;
      const updated = bookings.filter(b => b.id !== id);
      setBookings(updated);
      localStorage.setItem(storageKey, JSON.stringify(updated));
    }
  };

  if (!user) {
    return (
      <main className="profile-main">
        <div className="auth-container">
          <h1>{isRegistering ? 'Реєстрація' : 'Вхід у кабінет'}</h1>
          <form onSubmit={handleAuthAction} className="auth-form">
            <div className="input-group">
              <input 
                type="email" 
                placeholder="Email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            <div className="input-group">
              <input 
                type="password" 
                placeholder="Пароль" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>
            <button type="submit" className="confirm-btn">
              {isRegistering ? 'Створити аккаунт' : 'Увійти'}
            </button>
          </form>
          <p className="auth-toggle" onClick={() => setIsRegistering(!isRegistering)}>
            {isRegistering ? 'Вже є аккаунт? Увійдіть' : 'Немає аккаунту? Зареєструйтесь'}
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
          <button onClick={handleLogout} className="logout-btn">
            Вийти з системи
          </button>
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
                <span className="badge success">{booking.status || 'Підтверджено'}</span>
                <button className="cancel-btn" onClick={() => handleCancel(booking.id)}>
                  Скасувати
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-msg">
            <p>У вас поки немає заброньованих квитків.</p>
            <a href="/" className="browse-link">Переглянути події</a>
          </div>
        )}
      </div>
    </main>
  );
}

export default Profile;