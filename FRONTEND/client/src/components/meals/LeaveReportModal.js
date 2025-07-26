import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

const LeaveReportModal = ({ show, onClose, onConfirm, type }) => {
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const handleConfirm = () => {
    onConfirm({ reason, customReason: reason === 'Altro' ? customReason : undefined });
    setReason('');
    setCustomReason('');
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Lascia {type === 'meal' ? 'il TableTalk®' : 'la chat'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group>
            <Form.Label>Perché vuoi lasciare {type === 'meal' ? 'il TableTalk®' : 'la chat'}?</Form.Label>
            <Form.Control as="select" value={reason} onChange={e => setReason(e.target.value)}>
              <option value="">Seleziona un motivo</option>
              <option>Motivi personali</option>
              <option>Non mi sento a mio agio</option>
              <option>Problemi tecnici</option>
              <option>Altro</option>
            </Form.Control>
          </Form.Group>
          {reason === 'Altro' && (
            <Form.Group className="mt-2">
              <Form.Control
                type="text"
                placeholder="Scrivi il motivo..."
                value={customReason}
                onChange={e => setCustomReason(e.target.value)}
              />
            </Form.Group>
          )}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>Annulla</Button>
        <Button variant="danger" onClick={handleConfirm} disabled={!reason || (reason === 'Altro' && !customReason)}>Conferma</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default LeaveReportModal; 