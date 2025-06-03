import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaBars, FaTimes, FaUser, FaUtensils, FaHome, FaSignInAlt, FaUserPlus, FaBell } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Logo from './Logo';
import '../styles/Navbar.css';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Verifica l'autenticazione al caricamento e quando cambia il token
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, [location.pathname]);

  // Gestione dello scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Gestione del menu mobile
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Gestione del logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    toast.success('Logout effettuato con successo!');
    navigate('/login');
  };

  // Gestione delle notifiche
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  // Chiudi il menu quando si clicca fuori
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.nav-menu') && !event.target.closest('.menu-icon')) {
        setIsOpen(false);
      }
      if (showNotifications && !event.target.closest('.notifications-container')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, showNotifications]);

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        <Logo />
        
        <div className="menu-icon" onClick={toggleMenu}>
          {isOpen ? <FaTimes /> : <FaBars />}
        </div>

        <ul className={`nav-menu ${isOpen ? 'active' : ''}`}>
          <li className="nav-item">
            <Link to="/" className="nav-link" onClick={() => setIsOpen(false)}>
              <FaHome className="nav-icon" />
              Home
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/meals" className="nav-link" onClick={() => setIsOpen(false)}>
              <FaUtensils className="nav-icon" />
              Pasti
            </Link>
          </li>
          
          {isAuthenticated ? (
            <>
              <li className="nav-item">
                <Link to="/profile" className="nav-link" onClick={() => setIsOpen(false)}>
                  <FaUser className="nav-icon" />
                  Profilo
                </Link>
              </li>
              <li className="nav-item notifications">
                <button className="nav-link" onClick={toggleNotifications}>
                  <FaBell className="nav-icon" />
                  {notifications.length > 0 && (
                    <span className="notification-badge">{notifications.length}</span>
                  )}
                </button>
                {showNotifications && (
                  <div className="notifications-container">
                    {notifications.length > 0 ? (
                      notifications.map((notification, index) => (
                        <div key={index} className="notification-item">
                          {notification.message}
                        </div>
                      ))
                    ) : (
                      <div className="notification-item">Nessuna notifica</div>
                    )}
                  </div>
                )}
              </li>
              <li className="nav-item">
                <button className="nav-link logout-btn" onClick={handleLogout}>
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li className="nav-item">
                <Link to="/login" className="nav-link" onClick={() => setIsOpen(false)}>
                  <FaSignInAlt className="nav-icon" />
                  Accedi
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/register" className="nav-link register-btn" onClick={() => setIsOpen(false)}>
                  <FaUserPlus className="nav-icon" />
                  Registrati
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}

export default Navbar; 