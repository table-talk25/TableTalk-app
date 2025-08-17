import React, { useState } from 'react';
import ImageUploader from './index';
import { 
  PROFILE_PICTURE, 
  MEAL_COVER, 
  GALLERY, 
  HIGH_QUALITY,
  SOCIAL_MEDIA,
  MOBILE_OPTIMIZED,
  DESKTOP_OPTIMIZED 
} from '../../config/imageCompressionConfig';

// ESEMPI DI UTILIZZO DELLA COMPRESSIONE DELLE IMMAGINI
// Questo file mostra come configurare la compressione per diversi casi d'uso

const CompressionExamples = () => {
  const [selectedFiles, setSelectedFiles] = useState({});

  const handleImageSelect = (type) => (file) => {
    setSelectedFiles(prev => ({
      ...prev,
      [type]: file
    }));
  };

  const renderExample = (title, config, type, description) => (
    <div style={{ 
      backgroundColor: 'white', 
      padding: '20px', 
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      marginBottom: '20px'
    }}>
      <h3 style={{ color: '#007bff', marginBottom: '10px' }}>{title}</h3>
      <p style={{ color: '#666', marginBottom: '15px' }}>{description}</p>
      
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '15px', 
        borderRadius: '6px',
        marginBottom: '15px',
        fontSize: '14px'
      }}>
        <strong>Configurazione:</strong>
        <ul style={{ margin: '10px 0 0 20px' }}>
          <li>Qualità: {Math.round(config.compressionQuality * 100)}%</li>
          <li>Dimensioni max: {config.maxWidthCompression}×{config.maxHeightCompression}px</li>
          <li>Dimensione file max: {config.maxSizeMB || 5}MB</li>
        </ul>
      </div>
      
      <ImageUploader
        onImageSelect={handleImageSelect(type)}
        maxSizeMB={config.maxSizeMB || 5}
        enableCompression={config.enableCompression}
        compressionQuality={config.compressionQuality}
        maxWidthCompression={config.maxWidthCompression}
        maxHeightCompression={config.maxHeightCompression}
        aspectRatio={type === 'profile' ? 1 : undefined}
        minWidth={200}
        minHeight={200}
        maxWidth={4000}
        maxHeight={4000}
      />
      
      {selectedFiles[type] && (
        <div style={{ 
          backgroundColor: '#e3f2fd', 
          padding: '10px', 
          borderRadius: '6px',
          marginTop: '15px',
          fontSize: '14px'
        }}>
          <strong>File selezionato:</strong> {selectedFiles[type].name} 
          ({(selectedFiles[type].size / 1024 / 1024).toFixed(2)} MB)
        </div>
      )}
    </div>
  );

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '1200px', 
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ textAlign: 'center', color: '#333', marginBottom: '30px' }}>
        📸 Esempi di Compressione Immagini
      </h1>

      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '30px'
      }}>
        <h3>📋 Panoramica delle Configurazioni</h3>
        <p>
          Questa pagina mostra come configurare la compressione delle immagini per diversi casi d'uso.
          Ogni configurazione è ottimizzata per specifici scenari e requisiti di qualità.
        </p>
      </div>

      <div style={{ display: 'grid', gap: '20px' }}>
        {/* Foto di Profilo */}
        {renderExample(
          '👤 Foto di Profilo (Avatar)',
          PROFILE_PICTURE,
          'profile',
          'Ottimizzata per foto di profilo piccole e quadrate. Compressione moderata per mantenere la qualità visiva.'
        )}

        {/* Immagini di Copertina */}
        {renderExample(
          '🍽️ Immagini di Copertina Pasti',
          MEAL_COVER,
          'meal',
          'Perfetta per le immagini di copertina dei pasti. Rapporto 16:9 ottimizzato per dispositivi mobili.'
        )}

        {/* Gallerie */}
        {renderExample(
          '🖼️ Gallerie di Immagini',
          GALLERY,
          'gallery',
          'Configurazione bilanciata per gallerie. Buona qualità con dimensioni ridotte per il caricamento veloce.'
        )}

        {/* Alta Qualità */}
        {renderExample(
          '✨ Immagini ad Alta Qualità',
          HIGH_QUALITY,
          'high',
          'Per immagini che richiedono la massima qualità. Compressione minima per preservare i dettagli.'
        )}

        {/* Social Media */}
        {renderExample(
          '📱 Social Media',
          SOCIAL_MEDIA,
          'social',
          'Ottimizzata per piattaforme social. Rapporto 1:1 e compressione bilanciata per la condivisione.'
        )}

        {/* Mobile Ottimizzato */}
        {renderExample(
          '📱 Mobile Ottimizzato',
          MOBILE_OPTIMIZED,
          'mobile',
          'Per dispositivi mobili e connessioni lente. Compressione aggressiva per ridurre il consumo di dati.'
        )}

        {/* Desktop Ottimizzato */}
        {renderExample(
          '💻 Desktop Ottimizzato',
          DESKTOP_OPTIMIZED,
          'desktop',
          'Per dispositivi desktop con connessioni veloci. Qualità elevata con compressione moderata.'
        )}
      </div>

      {/* Pulsante per resettare tutti i file */}
      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <button
          onClick={() => setSelectedFiles({})}
          style={{
            padding: '12px 24px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          🔄 Reset Tutti i File
        </button>
      </div>

      {/* Informazioni aggiuntive */}
      <div style={{ 
        backgroundColor: '#e3f2fd', 
        padding: '20px', 
        borderRadius: '8px',
        marginTop: '30px'
      }}>
        <h3 style={{ color: '#1976d2', marginBottom: '15px' }}>
          💡 Suggerimenti per l'Utilizzo
        </h3>
        <ul>
          <li><strong>Foto di profilo:</strong> Usa sempre la configurazione PROFILE_PICTURE per avatar</li>
          <li><strong>Immagini di copertina:</strong> MEAL_COVER è perfetta per i pasti</li>
          <li><strong>Gallerie:</strong> GALLERY per collezioni di immagini</li>
          <li><strong>Social media:</strong> SOCIAL_MEDIA per post e condivisioni</li>
          <li><strong>Dispositivi mobili:</strong> MOBILE_OPTIMIZED per connessioni lente</li>
          <li><strong>Desktop:</strong> DESKTOP_OPTIMIZED per connessioni veloci</li>
        </ul>
      </div>
    </div>
  );
};

export default CompressionExamples;
