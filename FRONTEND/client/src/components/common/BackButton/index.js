// File: src/components/common/BackButton/index.js

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import { FaArrowLeft } from 'react-icons/fa';

const BackButton = ({ className }) => {
  const navigate = useNavigate();

  // La magia è qui: navigate(-1) torna indietro di una pagina nella cronologia
  const handleBack = () => {
    navigate(-1);
  };

  return (
    <Button variant="link" onClick={handleBack} className={`text-decoration-none text-secondary p-0 ${className}`}>
      <FaArrowLeft className="me-2" />
      Torna indietro
    </Button>
  );
};

export default BackButton; 