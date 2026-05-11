import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import eventsData from '../../events.json';
import { FaStar } from 'react-icons/fa';
import './EventDetails.css';

function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const eventIdInt = parseInt(id);

  const [user, setUser] = useState(null);
  const [qty, setQty] = useState(1);
  const [showCheckout, setShowCheckout] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState("0.0");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const event = eventsData.find(e => e.id === eventIdInt);

  // ВАЖЛИВО: Огортаємо в useCallback, щоб уникнути помилок рендеру
  const loadReviewsData = useCallback(async (pageNum) => {
    try {
      const res = await fetch(`/api/reviews/${id}?page=${pageNum}`);
      const data = await res.json();
      
      console.log("--- DEBUG REVIEWS ---", data);

      // Гнучка перевірка формату: масив або об'єкт
      const actualReviews = Array.isArray(data) ? data : (data.reviews || []);
      
      setReviews(actualReviews);
      
      if (actualReviews.length > 0) {
        const sum = actualReviews.reduce((acc, r) => acc + (r.rating || 0), 0);
        setAvgRating((sum / actualReviews.length).toFixed(1));
      } else {
        setAvgRating("0.0");
      }
      
      setTotalPages(data.totalPages || 1);
    } catch (e) {
      console.error("Помилка завантаження відгуків:", e);
      setReviews([]);
    }
  }, [id]); // Функція оновиться тільки при зміні ID події

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    loadReviewsData(page);
  }, [page, loadReviewsData]); // Тепер залежності правильні

  if (!event) return <div className="details-main"><h2>Подію не знайдено</h2></div>;

  const priceValue = parseInt(event.price.toString().replace(/\D/g, '')) || 0;
  const totalAmount = priceValue * (Number(qty) || 1);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    if (!token) {
      alert("Будь ласка, увійдіть в систему, щоб залишити відгук");
      navigate('/profile');
      return;
    }

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          eventId: eventIdInt, 
          rating, 
          comment 
        })
      });

      if (response.ok) {
        setComment("");
        setRating(5);
        setPage(1); 
        loadReviewsData(1);
        alert("Дякуємо за відгук!");
      } else {
        const errorData = await response.json();
        alert(`Помилка: ${errorData.error}`);
      }
    } catch (e) { 
      console.error("Помилка відправки відгуку:", e); 
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      alert("Увійдіть для бронювання");
      navigate('/profile');
      return;
    }

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: event.title,
          date: event.date,
          location: event.location,
          quantity: parseInt(qty),
          totalPrice: totalAmount
        })
      });

      if (response.ok) {
        alert("Заброньовано!");
        navigate('/profile');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <main className="details-container">
      <div className="event-card-horizontal">
        <div className="event-image-wrapper">
          <img src={`/images/${event.image}`} alt={event.title} />
        </div>
        <div className="event-info-wrapper">
          <h1>{event.title}</h1>
          <div className="rating-badge">⭐ Середня оцінка: <strong>{avgRating}</strong> / 5.0</div>
          <p className="event-desc">{event.description}</p>
          <div className="event-meta">
            <span>📅 {event.date}</span> | <span>📍 {event.location}</span>
          </div>
          <p className="event-price">Ціна: <strong>{event.price}</strong></p>
          <button className="book-btn-main" onClick={() => setShowCheckout(true)}>Забронювати</button>
        </div>
      </div>

      <div className="reviews-section-card">
        <h3>Залишити відгук про подію</h3>
        <div className="stars-row">
          {[1, 2, 3, 4, 5].map((s) => (
            <FaStar key={s} size={28} color={s <= rating ? "#ffc107" : "#e4e5e9"} 
                    onClick={() => setRating(s)} style={{cursor:'pointer'}} />
          ))}
        </div>
        <form onSubmit={handleReviewSubmit}>
          <textarea className="review-input" placeholder="Ваші враження..." 
                    value={comment} onChange={(e) => setComment(e.target.value)} required />
          <button type="submit" className="submit-review-btn">Опублікувати відгук</button>
        </form>

        <h4 className="reviews-title">Відгуки відвідувачів ({reviews.length})</h4>
        <div className="reviews-grid">
          {reviews.length > 0 ? (
            reviews.map((rev) => (
              <div key={rev.id} className="review-card">
                <div className="review-stars">
                    {"★".repeat(rev.rating || 0)}{"☆".repeat(5-(rev.rating || 0))}
                </div>
                {/* Перевірка на вкладений об'єкт user */}
                <span className="review-author">{rev.user?.email || "Анонімний користувач"}</span>
                <p className="review-text">{rev.comment}</p>
                <span className="review-date">
                    {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : ""}
                </span>
              </div>
            ))
          ) : (
            <p className="no-reviews">Відгуків поки немає. Будьте першим!</p>
          )}
        </div>

        {totalPages > 1 && (
          <div className="pagination-btns">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Назад</button>
            <span>{page} / {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Вперед</button>
          </div>
        )}
      </div>

      {showCheckout && (
        <div className="modal-overlay" onClick={() => setShowCheckout(false)}>
          <div className="booking-modal" onClick={e => e.stopPropagation()}>
            <h3>Бронювання</h3>
            <form onSubmit={handleBooking}>
              <div className="input-group">
                <label>Кількість квитків:</label>
                <input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} />
              </div>
              <p className="total-price">До сплати: <strong>{totalAmount} грн</strong></p>
              <div className="modal-actions">
                <button type="submit" className="confirm-btn">Підтвердити</button>
                <button type="button" className="cancel-btn" onClick={() => setShowCheckout(false)}>Скасувати</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default EventDetails;