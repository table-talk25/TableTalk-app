import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import mealService from '../../services/mealService';
import InlineEditTitle from './InlineEditTitle';
import InlineEditDescription from './InlineEditDescription';
import InlineEditDate from './InlineEditDate';
import InlineEditCoverImage from './InlineEditCoverImage';
import { getMealCoverImageUrl } from '../../constants/mealConstants';

// ESEMPIO DI UTILIZZO DEI COMPONENTI DI EDITING INLINE
// Questo file mostra come utilizzare i singoli componenti

const ExampleUsage = () => {
  const { t } = useTranslation();
  const [meal, setMeal] = useState({
    _id: '123',
    title: 'Cena Italiana',
    description: 'Una serata di conversazione sulla cucina italiana',
    date: '2024-12-25T19:00:00.000Z',
    coverImage: 'italian-dinner.jpg'
  });
  
  const [editingField, setEditingField] = useState(null);

  // Gestisce il salvataggio del titolo
  const handleTitleSave = async (newTitle) => {
    try {
      await mealService.updateMeal(meal._id, { title: newTitle });
      setMeal(prev => ({ ...prev, title: newTitle }));
      toast.success('Titolo aggiornato con successo!');
      setEditingField(null);
    } catch (error) {
      toast.error('Errore nell\'aggiornamento del titolo');
    }
  };

  // Gestisce il salvataggio della descrizione
  const handleDescriptionSave = async (newDescription) => {
    try {
      await mealService.updateMeal(meal._id, { description: newDescription });
      setMeal(prev => ({ ...prev, description: newDescription }));
      toast.success('Descrizione aggiornata con successo!');
      setEditingField(null);
    } catch (error) {
      toast.error('Errore nell\'aggiornamento della descrizione');
    }
  };

  // Gestisce il salvataggio della data
  const handleDateSave = async (newDate) => {
    try {
      await mealService.updateMeal(meal._id, { date: newDate });
      setMeal(prev => ({ ...prev, date: newDate }));
      toast.success('Data aggiornata con successo!');
      setEditingField(null);
    } catch (error) {
      toast.error('Errore nell\'aggiornamento della data');
    }
  };

  // Gestisce il salvataggio dell'immagine
  const handleCoverImageSave = async (newImageFile) => {
    try {
      const formData = new FormData();
      formData.append('coverImage', newImageFile);
      
      await mealService.updateMeal(meal._id, formData);
      setMeal(prev => ({ ...prev, coverImage: newImageFile.name }));
      toast.success('Immagine aggiornata con successo!');
      setEditingField(null);
    } catch (error) {
      toast.error('Errore nell\'aggiornamento dell\'immagine');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Esempio di Utilizzo dei Componenti di Editing Inline</h1>
      
      <div style={{ marginBottom: '30px' }}>
        <h2>1. Titolo Editabile</h2>
        <InlineEditTitle
          title={meal.title}
          onSave={handleTitleSave}
          isEditing={editingField === 'title'}
          onEditClick={() => setEditingField('title')}
          onCancel={() => setEditingField(null)}
        />
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h2>2. Immagine di Copertina Editabile</h2>
        <InlineEditCoverImage
          coverImage={meal.coverImage}
          onSave={handleCoverImageSave}
          isEditing={editingField === 'coverImage'}
          onEditClick={() => setEditingField('coverImage')}
          onCancel={() => setEditingField(null)}
          getImageUrl={getMealCoverImageUrl}
        />
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h2>3. Data Editabile</h2>
        <InlineEditDate
          date={meal.date}
          onSave={handleDateSave}
          isEditing={editingField === 'date'}
          onEditClick={() => setEditingField('date')}
          onCancel={() => setEditingField(null)}
        />
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h2>4. Descrizione Editabile</h2>
        <InlineEditDescription
          description={meal.description}
          onSave={handleDescriptionSave}
          isEditing={editingField === 'description'}
          onEditClick={() => setEditingField('description')}
          onCancel={() => setEditingField(null)}
        />
      </div>

      <div style={{ 
        padding: '20px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '8px',
        marginTop: '40px'
      }}>
        <h3>Istruzioni:</h3>
        <ul>
          <li>Clicca sull'icona di modifica (✏️) accanto a qualsiasi campo</li>
          <li>Modifica il valore nel campo che appare</li>
          <li>Clicca su ✓ per salvare o ✗ per annullare</li>
          <li>Per la descrizione, usa Ctrl+Enter per salvare</li>
          <li>Per la data, seleziona data e ora separatamente</li>
          <li>Per l'immagine, clicca su "Seleziona immagine" e scegli un file</li>
        </ul>
      </div>

      <div style={{ 
        padding: '20px', 
        backgroundColor: '#e3f2fd', 
        borderRadius: '8px',
        marginTop: '20px'
      }}>
        <h3>Stato Attuale del Pasto:</h3>
        <pre style={{ 
          backgroundColor: '#fff', 
          padding: '15px', 
          borderRadius: '4px',
          overflow: 'auto'
        }}>
          {JSON.stringify(meal, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default ExampleUsage;
