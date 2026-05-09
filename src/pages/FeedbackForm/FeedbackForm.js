import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebase-auth'; 
import { onAuthStateChanged } from "firebase/auth";
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp 
} from "firebase/firestore"; 
import { FaStar } from 'react-icons/fa';
import './FeedbackForm.css';

function FeedbackForm() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rating, setRating] = useState(null);
  const [hover, setHover] = useState(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [allReviews, setAllReviews] = useState([]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setEmail(currentUser.email);
        if (currentUser.displayName) setName(currentUser.displayName);
      }
    });

    const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
    const unsubscribeReviews = onSnapshot(q, (snapshot) => {
      const reviewsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAllReviews(reviewsData);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeReviews();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      alert("Будь ласка, оберіть рейтинг!");
      return;
    }

    try {
      await addDoc(collection(db, "reviews"), {
        name: name || "Анонім",
        email: email,
        rating: rating,
        comment: comment,
        createdAt: serverTimestamp()
      });

      setSubmitted(true);
      setRating(null);
      setComment('');
      if (!user) {
        setName('');
        setEmail('');
      }
      
      setTimeout(() => setSubmitted(false), 5000);
    } catch (error) {
      console.error("Помилка:", error);
    }
  };

  return (
    <main className="feedback-main">
      <div className="feedback-container">
        <h1>Ваша думка важлива для нас</h1>
        <p>Поділіться своїми враженнями від користування OnlineTickets</p>

        {submitted && (
          <div className="alert-success">
            ✅ Дякуємо! Ваш відгук успішно збережено.
          </div>
        )}

        <form onSubmit={handleSubmit} className="feedback-form">
          <div className="input-group">
            <label>Оцініть нашу роботу:</label>
            <div className="star-rating">
              {[...Array(5)].map((_, index) => {
                const ratingValue = index + 1;
                return (
                  <label key={index} className="star-label">
                    <input 
                      type="radio" 
                      name="rating" 
                      value={ratingValue} 
                      onClick={() => setRating(ratingValue)}
                    />
                    <FaStar 
                      className="star" 
                      color={ratingValue <= (hover || rating) ? "#ffc107" : "#e4e5e9"} 
                      size={35}
                      onMouseEnter={() => setHover(ratingValue)}
                      onMouseLeave={() => setHover(null)}
                    />
                  </label>
                );
              })}
              {rating && <span className="rating-text">{rating} з 5</span>}
            </div>
          </div>

          <div className="input-row">
            <div className="input-group">
              <input 
                type="text" 
                placeholder="Ваше ім'я" 
                value={name}
                onChange={(e) => setName(e.target.value)} 
                required={!user}
              />
            </div>
            <div className="input-group">
              <input 
                type="email" 
                placeholder="Email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)} 
                required 
                disabled={!!user}
              />
            </div>
          </div>

          <div className="input-group">
            <textarea 
              placeholder="Напишіть ваш відгук тут..." 
              value={comment}
              onChange={(e) => setComment(e.target.value)} 
              rows="5"
              required
            ></textarea>
          </div>

          <button type="submit" className="confirm-btn">Опублікувати відгук</button>
        </form>

        <div className="reviews-list">
          <h2>Останні відгуки користувачів</h2>
          {allReviews.map((rev) => (
            <div key={rev.id} className="booking-card review-item">
              <div className="review-header">
                <strong>{rev.name}</strong>
                <span className="stars-display">
                  {"★".repeat(rev.rating)}{"☆".repeat(5 - rev.rating)}
                </span>
              </div>
              <p>{rev.comment}</p>
              <small>
                {rev.createdAt?.toDate().toLocaleDateString('uk-UA')}
              </small>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export default FeedbackForm;