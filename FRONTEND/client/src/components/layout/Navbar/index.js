// File: src/components/layout/Navbar/index.js (Versione Definitiva)

import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { FaBars, FaTimes, FaHome, FaUserCircle, FaUser, FaMapMarkerAlt } from 'react-icons/fa';
import { useAuth } from '../../../contexts/AuthContext';
import Logo from '../../common/Logo';
import styles from './Navbar.module.css';
import Notifications from '../../../components/notifications/Notifications'; 
import { getHostAvatarUrl } from '../../../constants/mealConstants';

const Navbar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleLogout = () => {
    logout();
    closeMobileMenu();
    navigate('/login');
  };

  return (
    <nav className={`${styles.navbar} ${isScrolled ? styles.scrolled : ''}`}>
      <div className={styles.navContainer}>
        {/* Logo a sinistra */}
        <Link to="/" className={styles.navLogo} onClick={closeMobileMenu}>
          <Logo />
        </Link>

        {/* Menu di navigazione centrale per DESKTOP */}
        <div className={styles.navMenuDesktop}>
                            <NavLink to="/meals" className={({ isActive }) => (isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink)}>TableTalk®</NavLink>
            {isAuthenticated && (
                <>
                    <NavLink to="/my-meals" className={({ isActive }) => (isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink)}>I Miei TableTalk®</NavLink>
                    {/* --- LINK MAPPA PER DESKTOP --- */}
                    <NavLink to="/map" className={({ isActive }) => (isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink)}>Mappa</NavLink>
                </>
            )}
        </div>

        {/* Azioni a destra */}
        <div className={styles.rightSection}>
            {isAuthenticated ? (
                <>
                    <div className={styles.desktopActions}>
                        <Notifications />
                        <Link to={`/impostazioni/profilo`}> {/* Corretto il link al profilo */}
                            <img src={getHostAvatarUrl(user?.profileImage)} alt="Mio Profilo" className={styles.profileAvatar} />
                        </Link>
                        <button className={styles.logoutButton} onClick={handleLogout}>Logout</button>
                    </div>
                    <div className={styles.mobileActions}>
                        <Notifications />
                        <div className={styles.menuIcon} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                            {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
                        </div>
                    </div>
                </>
            ) : (
                <div className={styles.guestActions}>
                    <Link to="/login" className={styles.loginButton}>Accedi</Link>
                    <Link to="/register" className={styles.registerButton}>Registrati</Link>
                </div>
            )}
        </div>

        {/* Menu a tendina per MOBILE */}
        {isMobileMenuOpen && (
            <ul className={styles.navMenuMobile}>
                <li className={styles.navItem}><NavLink to="/meals" className={({ isActive }) => (isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink)} onClick={closeMobileMenu}>TableTalk®</NavLink></li>
                {isAuthenticated && (
                    <>
                        <li className={styles.navItem}><NavLink to="/my-meals" className={({ isActive }) => (isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink)} onClick={closeMobileMenu}>I Miei TableTalk®</NavLink></li>
                        {/* --- LINK MAPPA PER MOBILE --- */}
                        <li className={styles.navItem}><NavLink to="/map" className={({ isActive }) => (isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink)} onClick={closeMobileMenu}><FaMapMarkerAlt /> Mappa</NavLink></li>
                        <li className={styles.navItem}><NavLink to="/impostazioni/profilo" className={({ isActive }) => (isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink)} onClick={closeMobileMenu}>Il Mio Profilo</NavLink></li>
                        <li className={styles.navItem}><button className={styles.logoutButtonMobile} onClick={handleLogout}>Logout</button></li>
                    </>
                )}
            </ul>
        )}
      </div>
    </nav>
  );
};

export default Navbar;