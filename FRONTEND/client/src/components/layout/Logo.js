import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/Logo.css';

function Logo() {
  return (
    <Link to="/" className="logo">
      <img 
        src="/images/logo.webp" 
        alt="TableTalk Logo" 
        className="logo-full-image"
      />
    </Link>
  );
}

export default Logo; 