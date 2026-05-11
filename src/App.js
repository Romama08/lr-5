import React, { useState, useEffect } from 'react'; 
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home/Home';
import EventDetails from './pages/EventDetails/EventDetails';
import Profile from './pages/Profile/Profile';
import Organizers from './pages/Organizers/Organizers';
import FeedbackForm from './pages/FeedbackForm/FeedbackForm';
import './App.css';

function App() {
  const [user, setUser] = useState(null);

  const checkAuth = () => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    checkAuth();

    window.addEventListener('storage', checkAuth);

    window.addEventListener('authChange', checkAuth);

    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('authChange', checkAuth);
    };
  }, []);

  return (
    <Router>
      <header>
        <Link to="/" className="logo-link">
          <div className="logo">OnlineTickets</div>
        </Link>

        <nav>
          <ul className="nav-menu">
            <li><Link to="/organizers">Організатори</Link></li>
            {user && (<li><Link to="/feedback">Відгуки</Link></li>)}
            <li>
              <Link to="/profile" className="profile-link">
                {user ? 'Мій профіль' : 'Увійти'}
              </Link>
            </li>
          </ul>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/event/:id" element={<EventDetails />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/organizers" element={<Organizers />} />
        <Route path="/feedback" element={<FeedbackForm />} />
      </Routes>

      <footer>
        <div className="footer-info">
          <p>м. Львів, вул. Степана Бандери, 12</p>
          <p>+38 (067) 123-45-67 | support@onlinetickets.ua</p>
        </div>
        <p className="copyright">&copy; 2026 OnlineTickets</p>
      </footer>
    </Router>
  );
}

export default App;