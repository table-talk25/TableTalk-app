import React from 'react';
import './Spinner.css';

const Spinner = ({ fullscreen = false, label }) => (
  <div className={`spinner-container${fullscreen ? ' fullscreen' : ''}`}>
    <div className="spinner"></div>
    {label ? <div className="spinner-label">{label}</div> : null}
  </div>
);

export default Spinner;