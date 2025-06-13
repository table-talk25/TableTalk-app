import React from 'react';
import { FaTimes } from 'react-icons/fa';
import '../../styles/ConfirmationModal.css'; 

const ConfirmationModal = ({
  show,                // Prop booleana per mostrare/nascondere il modale
  onClose,             // Funzione per chiudere il modale
  onConfirm,           // Funzione da eseguire alla conferma
  title,               // Titolo del modale
  children,            // Contenuto personalizzato (es. un testo o un form)
  confirmText = 'Conferma',
  cancelText = 'Annulla',
  isConfirming = false // Per mostrare uno stato di caricamento sul pulsante di conferma
}) => {
  if (!show) {
    return null; // Se 'show' è false, il componente non renderizza nulla
  }

  return (
    // L'overlay scuro che copre tutta la pagina
    <div className="modal-overlay" onClick={onClose}>
      {/* Il contenitore del modale. Usiamo e.stopPropagation() per evitare che un click qui dentro chiuda il modale. */}
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        
        {/* Header del modale con titolo e pulsante di chiusura */}
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close-button" onClick={onClose} aria-label="Chiudi modale">
            <FaTimes />
          </button>
        </div>

        {/* Corpo del modale, dove verrà inserito il contenuto personalizzato */}
        <div className="modal-body">
          {children}
        </div>

        {/* Footer del modale con i pulsanti di azione */}
        <div className="modal-footer">
          <button className="modal-button cancel" onClick={onClose}>
            {cancelText}
          </button>
          <button 
            className="modal-button confirm" 
            onClick={onConfirm}
            disabled={isConfirming}
          >
            {isConfirming ? <div className="spinner-small"></div> : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;