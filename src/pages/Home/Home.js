import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import eventsData from '../../events.json';
import './Home.css';

function Home() {
  const navigate = useNavigate();
  const [category, setCategory] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [showAbout, setShowAbout] = useState(true);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [ratings, setRatings] = useState({});

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filtered = eventsData.filter(event => {
      const eventDate = new Date(event.date);
      if (eventDate < today) return false;

      const matchCat = category === 'all' || event.category === category;
      const priceNum = parseInt(event.price.toString().replace(/\D/g, ''));
      
      let matchPrice = true;
      if (priceRange === 'low') matchPrice = priceNum < 500;
      else if (priceRange === 'medium') matchPrice = priceNum >= 500 && priceNum <= 1000;
      else if (priceRange === 'high') matchPrice = priceNum > 1000;

      return matchCat && matchPrice;
    });
    setFilteredEvents(filtered);
  }, [category, priceRange]);

  useEffect(() => {
    const fetchRatings = async () => {
      const ratingsMap = {};
      for (const event of eventsData) {
        try {
          const res = await fetch(`/api/reviews/${event.id}`);
          const data = await res.json();
          ratingsMap[event.id] = data.averageRating;
        } catch (e) {
          ratingsMap[event.id] = "0.0";
        }
      }
      setRatings(ratingsMap);
    };
    fetchRatings();
  }, []);

  return (
    <main>
      <section id="events">
        <h2>Майбутні події</h2>
        
        <div className="filters-container">
          <div className="filter-group">
            <label>Категорія:</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="all">Усі заходи</option>
              <option value="music">Музика</option>
              <option value="humor">Гумор</option>
              <option value="art">Мистецтво</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Ціна:</label>
            <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)}>
              <option value="all">Будь-яка</option>
              <option value="low">до 500 грн</option>
              <option value="medium">500-1000 грн</option>
              <option value="high">від 1000 грн</option>
            </select>
          </div>
          <button className="reset-btn" onClick={() => {setCategory('all'); setPriceRange('all')}}>
            Очистити
          </button>
        </div>

        <div className="events-grid">
          {filteredEvents.map((event) => (
            <article key={event.id} className="event-card" onClick={() => navigate(`/event/${event.id}`)}>
              <img src={process.env.PUBLIC_URL + `/images/${event.image}`} alt={event.title} />
              <div className="event-content">
                <h3>{event.title}</h3>
                <div className="rating-badge">⭐ {ratings[event.id] || "0.0"} / 5.0</div>
                <p>📅 {event.date}</p>
                <p>📍 {event.location}</p>
                <p className="price">Ціна: {event.price}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="about" className="about-content">
        <h2>Про нас</h2>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <button className="reset-btn" onClick={() => setShowAbout(!showAbout)}>
            {showAbout ? "Приховати опис" : "Показати опис"}
          </button>
        </div>
        {showAbout && (
          <div className="about-card">
            <img src="https://picsum.photos/seed/tickets/1000/400" alt="Про нас" className="about-img" />
            <div className="description-box">
              <p>OnlineTickets — це платформа для бронювання квитків з реальними відгуками користувачів.</p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default Home;