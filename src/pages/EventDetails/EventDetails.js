import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth } from '../../firebase-auth';
import { onAuthStateChanged } from "firebase/auth";
import eventsData from '../../events.json';
import { FaStar } from 'react-icons/fa';
import './EventDetails.css';

function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [qty, setQty] = useState(1);
  const [showCheckout, setShowCheckout] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState("0.0");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const event = eventsData.find(e => e.id === parseInt(id));

  const loadReviewsData = async (pageNum) => {
    try {
      const res = await fetch(`/api/reviews/${id}?page=${pageNum}`);
      const data = await res.json();
      setReviews(data.reviews || []);
      setAvgRating(data.averageRating || "0.0");
      setTotalPages(data.totalPages || 1);
    } catch (e) {
      console.error("Помилка завантаження");
      setReviews([]);
    }
  };

  useEffect(() => {
    onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    loadReviewsData(page);
  }, [id, page]);

  if (!event) return <div className="details-main"><h2>Подію не знайдено</h2></div>;

  const priceValue = parseInt(event.price.toString().replace(/\D/g, '')) || 0;
  const totalAmount = priceValue * (Number(qty) || 1);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: id, rating, comment })
      });
      if (response.ok) {
        setComment("");
        setRating(5);
        loadReviewsData(1);
        alert("Дякуємо за відгук!");
      }
    } catch (e) { console.error(e); }
  };

  const handleBooking = (e) => {
    e.preventDefault();
    const storageKey = user ? `userBookings_${user.email}` : 'userBookings';
    const currentBookings = JSON.parse(localStorage.getItem(storageKey)) || [];
    currentBookings.push({
      id: Date.now(),
      title: event.title,
      quantity: Number(qty),
      totalPrice: totalAmount,
      status: "Заброньовано"
    });
    localStorage.setItem(storageKey, JSON.stringify(currentBookings));
    navigate('/profile');
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
          {reviews.map((rev) => (
            <div key={rev.id} className="review-card">
              <div className="review-stars">{"★".repeat(rev.rating)}{"☆".repeat(5-rev.rating)}</div>
              <p className="review-text">{rev.comment}</p>
              <span className="review-date">{new Date(rev.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="pagination-btns">
            <button disabled={page === 1} onClick={() => setPage(page - 1)}>Назад</button>
            <span>{page} / {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(page + 1)}>Вперед</button>
          </div>
        )}
      </div>

      {showCheckout && (
        <div className="modal-overlay">
          <div className="booking-modal">
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