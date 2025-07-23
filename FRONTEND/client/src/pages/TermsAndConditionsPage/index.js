// File: frontend/client/src/pages/TermsAndConditionsPage/index.js

import React from 'react';
import { Container } from 'react-bootstrap';
import BackButton from '../../components/common/BackButton';

const TermsAndConditionsPage = () => {
  return (
    <Container className="my-5" style={{ maxWidth: '800px' }}>
      <h1 className="mb-4">Termini e Condizioni di TableTalk</h1>
      <p><strong>Ultimo aggiornamento:</strong> 16 Luglio 2025</p>
      
      <p className="lead">
        Benvenuto in TableTalk. Ti preghiamo di leggere attentamente questi Termini e Condizioni prima di utilizzare il nostro servizio.
      </p>

      <h3 className="mt-4">1. Accettazione dei Termini</h3>
      <p>
        Accedendo e utilizzando la piattaforma TableTalk (il "Servizio"), accetti di essere vincolato da questi Termini. Se non sei d'accordo con una qualsiasi parte dei termini, non puoi accedere al Servizio.
      </p>

      <h3 className="mt-4">2. Descrizione del Servizio</h3>
      <p>
        TableTalk è una piattaforma che facilita l'incontro virtuale tra persone per condividere pasti e conversazioni tramite videochiamata. Gli utenti possono creare eventi ("Pasti") o partecipare a quelli creati da altri.
      </p>

      <h3 className="mt-4">3. Condotta dell'Utente</h3>
      <p>
        L'utente si impegna a mantenere un comportamento rispettoso, inclusivo e non offensivo. È severamente vietato qualsiasi comportamento molesto, discriminatorio o illegale. È vietato registrare le videochiamate senza il consenso esplicito di tutti i partecipanti.
      </p>

      <h3 className="mt-4">4. Limitazione di Responsabilità</h3>
      <p>
        TableTalk fornisce unicamente la piattaforma tecnologica per connettere gli utenti e non è responsabile della condotta degli utenti o del contenuto delle conversazioni durante i Pasti. L'utilizzo del Servizio è a proprio rischio.
      </p>

      <h3 className="mt-4">5. Modifiche al Servizio e ai Termini</h3>
      <p>
        Ci riserviamo il diritto di modificare o interrompere il Servizio in qualsiasi momento. Potremmo anche revisionare questi Termini di volta in volta. L'uso continuato del Servizio dopo tali modifiche costituisce l'accettazione dei nuovi Termini.
      </p>

      <BackButton className="mb-4" /> 

    </Container>
  );
};

export default TermsAndConditionsPage;