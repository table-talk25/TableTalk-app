import React, { useEffect, useState } from 'react';
import { getReceivedInvitations, acceptInvitation } from '../../services/invitationService';
import { Button, Card, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

const InvitationsPage = () => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getReceivedInvitations()
      .then(data => setInvitations(data.data))
      .catch(() => toast.error('Errore nel caricamento degli inviti'))
      .finally(() => setLoading(false));
  }, []);

  const handleAccept = async (invitationId) => {
    try {
      await acceptInvitation(invitationId);
      toast.success('Invito accettato! Ora puoi chattare.');
      setInvitations(prev => prev.filter(inv => inv._id !== invitationId));
    } catch {
      toast.error('Errore nell\'accettazione dell\'invito.');
    }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <h2>I tuoi inviti</h2>
      {invitations.length === 0 && <p>Nessun invito ricevuto.</p>}
      {invitations.map(inv => (
        <Card key={inv._id} className="mb-3">
          <Card.Body>
            <Card.Title>Da: {inv.sender.nickname}</Card.Title>
            <Card.Text>{inv.message}</Card.Text>
            {inv.status === 'accepted' && inv.chatId ? (
              <Link to={`/chat/${inv.chatId}`}>Vai alla chat</Link>
            ) : (
              <Button onClick={() => handleAccept(inv._id)}>Accetta</Button>
            )}
          </Card.Body>
        </Card>
      ))}
    </div>
  );
};

export default InvitationsPage; 