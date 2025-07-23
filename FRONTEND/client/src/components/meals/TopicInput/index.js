import React, { useState } from 'react';
import styles from './TopicInput.module.css';

const TopicInput = ({ topics, setTopics }) => {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e) => {
    // Se preme "Invio" o "Virgola"
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault(); // Impedisce al form di essere inviato o di scrivere la virgola
      
      const newTopic = inputValue.trim();

      // Aggiungi l'argomento solo se non è vuoto e non è già presente
      if (newTopic && !topics.includes(newTopic)) {
        if (topics.length < 5) { // Limite di 5 argomenti
            setTopics([...topics, newTopic]);
        } else {
            // Potresti mostrare un avviso qui se vuoi
            console.warn("Limite massimo di 5 argomenti raggiunto.");
        }
      }
      setInputValue(''); // Pulisci l'input
    }
  };

  const removeTopic = (topicToRemove) => {
    setTopics(topics.filter(topic => topic !== topicToRemove));
  };

  return (
    <div className={styles.topicInputContainer}>
      {topics.map((topic, index) => (
        <div key={index} className={styles.topicTag}>
          {topic}
          <button 
            type="button" 
            className={styles.removeTagButton} 
            onClick={() => removeTopic(topic)}
          >
            &times;
          </button>
        </div>
      ))}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={topics.length < 5 ? 'Aggiungi un argomento...' : 'Massimo 5 argomenti'}
        className={styles.topicInput}
        disabled={topics.length >= 5}
      />
    </div>
  );
};

export default TopicInput;