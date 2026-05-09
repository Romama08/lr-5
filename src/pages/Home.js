import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import eventsData from '../events.json';

function Home() {
  const navigate = useNavigate();
  const [category, setCategory] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [showAbout, setShowAbout] = useState(true);
  const [filteredEvents, setFilteredEvents] = useState([]);

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
              <p>OnlineTickets — це сучасна платформа для швидкого та зручного бронювання квитків на концерти, фестивалі, вистави та інші події.</p>
              <p>Ми співпрацюємо з провідними організаторами заходів України та гарантуємо безпечну оплату.</p>
              
              <h3>Наші переваги:</h3>
              <ul>
                <li>Швидке онлайн-бронювання</li>
                <li>Безпечні платежі</li>
                <li>Підтримка 24/7</li>
                <li>Електронні квитки</li>
              </ul>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default Home;