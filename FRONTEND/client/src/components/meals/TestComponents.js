import React, { useState } from 'react';
import InlineEditTitle from './InlineEditTitle';
import InlineEditDescription from './InlineEditDescription';
import InlineEditDate from './InlineEditDate';
import InlineEditCoverImage from './InlineEditCoverImage';

// FILE DI TEST PER I COMPONENTI DI EDITING INLINE
// Questo file permette di testare i componenti senza dipendenze esterne

const TestComponents = () => {
  const [testData, setTestData] = useState({
    title: 'Test Title',
    description: 'Test description for the meal',
    date: '2024-12-25T19:00:00.000Z',
    coverImage: 'test-image.jpg'
  });

  const [editingField, setEditingField] = useState(null);

  // Funzioni di test per simulare il salvataggio
  const handleTitleSave = async (newTitle) => {
    console.log('Salvando titolo:', newTitle);
    setTestData(prev => ({ ...prev, title: newTitle }));
    setEditingField(null);
    alert(`Titolo salvato: ${newTitle}`);
  };

  const handleDescriptionSave = async (newDescription) => {
    console.log('Salvando descrizione:', newDescription);
    setTestData(prev => ({ ...prev, description: newDescription }));
    setEditingField(null);
    alert(`Descrizione salvata: ${newDescription}`);
  };

  const handleDateSave = async (newDate) => {
    console.log('Salvando data:', newDate);
    setTestData(prev => ({ ...prev, date: newDate }));
    setEditingField(null);
    alert(`Data salvata: ${newDate}`);
  };

  const handleCoverImageSave = async (newImageFile) => {
    console.log('Salvando immagine:', newImageFile);
    setTestData(prev => ({ ...prev, coverImage: newImageFile.name }));
    setEditingField(null);
    alert(`Immagine salvata: ${newImageFile.name}`);
  };

  // Funzione helper per simulare getMealCoverImageUrl
  const getImageUrl = (imageName) => {
    return `https://via.placeholder.com/400x200/007bff/ffffff?text=${imageName}`;
  };

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '1000px', 
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ textAlign: 'center', color: '#333', marginBottom: '30px' }}>
        🧪 Test dei Componenti di Editing Inline
      </h1>

      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '30px'
      }}>
        <h3>📋 Istruzioni per il Test:</h3>
        <ul>
          <li>Clicca sull'icona ✏️ per modificare ogni campo</li>
          <li>Modifica i valori e clicca ✓ per salvare o ✗ per annullare</li>
          <li>Controlla la console per vedere i log delle operazioni</li>
          <li>Verifica che i dati vengano aggiornati correttamente</li>
        </ul>
      </div>

      <div style={{ display: 'grid', gap: '30px' }}>
        {/* Test Titolo */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ color: '#007bff', marginBottom: '15px' }}>
            1️⃣ Test InlineEditTitle
          </h2>
          <InlineEditTitle
            title={testData.title}
            onSave={handleTitleSave}
            isEditing={editingField === 'title'}
            onEditClick={() => setEditingField('title')}
            onCancel={() => setEditingField(null)}
            size="h2"
          />
        </div>

        {/* Test Immagine */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ color: '#007bff', marginBottom: '15px' }}>
            2️⃣ Test InlineEditCoverImage
          </h2>
          <InlineEditCoverImage
            coverImage={testData.coverImage}
            onSave={handleCoverImageSave}
            isEditing={editingField === 'coverImage'}
            onEditClick={() => setEditingField('coverImage')}
            onCancel={() => setEditingField(null)}
            getImageUrl={getImageUrl}
          />
        </div>

        {/* Test Data */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ color: '#007bff', marginBottom: '15px' }}>
            3️⃣ Test InlineEditDate
          </h2>
          <InlineEditDate
            date={testData.date}
            onSave={handleDateSave}
            isEditing={editingField === 'date'}
            onEditClick={() => setEditingField('date')}
            onCancel={() => setEditingField(null)}
          />
        </div>

        {/* Test Descrizione */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ color: '#007bff', marginBottom: '15px' }}>
            4️⃣ Test InlineEditDescription
          </h2>
          <InlineEditDescription
            description={testData.description}
            onSave={handleDescriptionSave}
            isEditing={editingField === 'description'}
            onEditClick={() => setEditingField('description')}
            onCancel={() => setEditingField(null)}
          />
        </div>
      </div>

      {/* Visualizzazione dello stato */}
      <div style={{ 
        backgroundColor: '#e3f2fd', 
        padding: '20px', 
        borderRadius: '8px',
        marginTop: '30px'
      }}>
        <h3 style={{ color: '#1976d2', marginBottom: '15px' }}>
          📊 Stato Attuale dei Dati di Test
        </h3>
        <pre style={{ 
          backgroundColor: 'white', 
          padding: '15px', 
          borderRadius: '4px',
          overflow: 'auto',
          fontSize: '14px'
        }}>
          {JSON.stringify(testData, null, 2)}
        </pre>
      </div>

      {/* Pulsante per resettare i dati */}
      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <button
          onClick={() => {
            setTestData({
              title: 'Test Title',
              description: 'Test description for the meal',
              date: '2024-12-25T19:00:00.000Z',
              coverImage: 'test-image.jpg'
            });
            setEditingField(null);
            alert('Dati resettati!');
          }}
          style={{
            padding: '12px 24px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          🔄 Reset Dati di Test
        </button>
      </div>
    </div>
  );
};

export default TestComponents;
