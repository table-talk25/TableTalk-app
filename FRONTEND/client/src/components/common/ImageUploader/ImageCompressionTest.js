import React, { useState } from 'react';
import ImageUploader from './index';

// COMPONENTE DI TEST PER LA COMPRESSIONE DELLE IMMAGINI
// Questo file permette di testare la funzionalità di compressione

const ImageCompressionTest = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [compressionStats, setCompressionStats] = useState(null);

  const handleImageSelect = (file) => {
    setSelectedFile(file);
    
    // Calcola le statistiche della compressione
    if (file && file.originalSize) {
      const originalSize = file.originalSize;
      const compressedSize = file.size;
      const reduction = ((originalSize - compressedSize) / originalSize) * 100;
      
      setCompressionStats({
        originalSize: (originalSize / 1024 / 1024).toFixed(2),
        compressedSize: (compressedSize / 1024 / 1024).toFixed(2),
        reduction: reduction.toFixed(1),
        originalDimensions: file.originalDimensions || 'N/A',
        compressedDimensions: file.compressedDimensions || 'N/A'
      });
    } else {
      setCompressionStats(null);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '800px', 
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ textAlign: 'center', color: '#333', marginBottom: '30px' }}>
        🧪 Test Compressione Immagini
      </h1>

      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '30px'
      }}>
        <h3>📋 Istruzioni per il Test:</h3>
        <ul>
          <li>Seleziona un'immagine di grandi dimensioni (5-10 MB o più)</li>
          <li>L'immagine verrà compressa automaticamente</li>
          <li>Controlla la console per vedere i log di compressione</li>
          <li>Verifica la riduzione della dimensione del file</li>
        </ul>
      </div>

      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '30px'
      }}>
        <h2 style={{ color: '#007bff', marginBottom: '15px' }}>
          📤 Upload Immagine con Compressione
        </h2>
        
        <ImageUploader
          onImageSelect={handleImageSelect}
          maxSizeMB={10}
          enableCompression={true}
          compressionQuality={0.8}
          maxWidthCompression={1280}
          maxHeightCompression={1280}
          aspectRatio={1}
          minWidth={200}
          minHeight={200}
          maxWidth={4000}
          maxHeight={4000}
        />
      </div>

      {/* Statistiche della compressione */}
      {compressionStats && (
        <div style={{ 
          backgroundColor: '#e3f2fd', 
          padding: '20px', 
          borderRadius: '8px',
          marginBottom: '30px'
        }}>
          <h3 style={{ color: '#1976d2', marginBottom: '15px' }}>
            📊 Statistiche della Compressione
          </h3>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px'
          }}>
            <div style={{ 
              backgroundColor: 'white', 
              padding: '15px', 
              borderRadius: '6px',
              textAlign: 'center'
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#dc3545' }}>
                Dimensione Originale
              </h4>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
                {compressionStats.originalSize} MB
              </p>
            </div>
            
            <div style={{ 
              backgroundColor: 'white', 
              padding: '15px', 
              borderRadius: '6px',
              textAlign: 'center'
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#28a745' }}>
                Dimensione Compressa
              </h4>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
                {compressionStats.compressedSize} MB
              </p>
            </div>
            
            <div style={{ 
              backgroundColor: 'white', 
              padding: '15px', 
              borderRadius: '6px',
              textAlign: 'center'
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#007bff' }}>
                Riduzione
              </h4>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
                {compressionStats.reduction}%
              </p>
            </div>
          </div>
          
          <div style={{ 
            backgroundColor: 'white', 
            padding: '15px', 
            borderRadius: '6px',
            marginTop: '15px'
          }}>
            <h4 style={{ margin: '0 0 10px 0' }}>Dettagli:</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <strong>Dimensioni Originali:</strong> {compressionStats.originalDimensions}
              </div>
              <div>
                <strong>Dimensioni Compresse:</strong> {compressionStats.compressedDimensions}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Informazioni sul file selezionato */}
      {selectedFile && (
        <div style={{ 
          backgroundColor: '#fff3cd', 
          padding: '20px', 
          borderRadius: '8px',
          marginBottom: '30px'
        }}>
          <h3 style={{ color: '#856404', marginBottom: '15px' }}>
            📁 File Selezionato
          </h3>
          
          <div style={{ 
            backgroundColor: 'white', 
            padding: '15px', 
            borderRadius: '6px'
          }}>
            <pre style={{ margin: 0, fontSize: '14px' }}>
              {JSON.stringify({
                name: selectedFile.name,
                size: (selectedFile.size / 1024 / 1024).toFixed(2) + ' MB',
                type: selectedFile.type,
                lastModified: new Date(selectedFile.lastModified).toLocaleString()
              }, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Pulsante per resettare */}
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={() => {
            setSelectedFile(null);
            setCompressionStats(null);
          }}
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
          🔄 Reset Test
        </button>
      </div>
    </div>
  );
};

export default ImageCompressionTest;
