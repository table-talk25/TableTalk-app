import React, { useState } from 'react';
import { FaPlus, FaTimes } from 'react-icons/fa';
import './InterestsSection.css';

const InterestsSection = ({ profileData, onUpdate, isUpdating }) => {
    const [newInterest, setNewInterest] = useState('');
    const [newLanguage, setNewLanguage] = useState('');
    const [newCuisine, setNewCuisine] = useState('');

    const handleAddInterest = () => {
        if (newInterest.trim() && !profileData.interests.includes(newInterest.trim())) {
            onUpdate({
                ...profileData,
                interests: [...profileData.interests, newInterest.trim()]
            });
            setNewInterest('');
        }
    };

    const handleRemoveInterest = (interest) => {
        onUpdate({
            ...profileData,
            interests: profileData.interests.filter(i => i !== interest)
        });
    };

    const handleAddLanguage = () => {
        if (newLanguage.trim() && !profileData.languages.includes(newLanguage.trim())) {
            onUpdate({
                ...profileData,
                languages: [...profileData.languages, newLanguage.trim()]
            });
            setNewLanguage('');
        }
    };

    const handleRemoveLanguage = (language) => {
        onUpdate({
            ...profileData,
            languages: profileData.languages.filter(l => l !== language)
        });
    };

    const handleAddCuisine = () => {
        if (newCuisine.trim() && !profileData.preferredCuisine.includes(newCuisine.trim())) {
            onUpdate({
                ...profileData,
                preferredCuisine: [...profileData.preferredCuisine, newCuisine.trim()]
            });
            setNewCuisine('');
        }
    };

    const handleRemoveCuisine = (cuisine) => {
        onUpdate({
            ...profileData,
            preferredCuisine: profileData.preferredCuisine.filter(c => c !== cuisine)
        });
    };

    return (
        <div className="interests-section">
            <h2>Interessi e Preferenze</h2>
            
            {/* Interessi */}
            <div className="interests-group">
                <h3>Interessi</h3>
                <div className="interests-list">
                    {profileData.interests.map((interest, index) => (
                        <div key={index} className="interest-item">
                            <span>{interest}</span>
                            <button 
                                onClick={() => handleRemoveInterest(interest)}
                                className="remove-btn"
                            >
                                <FaTimes />
                            </button>
                        </div>
                    ))}
                </div>
                <div className="add-interest">
                    <input
                        type="text"
                        value={newInterest}
                        onChange={(e) => setNewInterest(e.target.value)}
                        placeholder="Aggiungi un interesse"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddInterest()}
                    />
                    <button onClick={handleAddInterest} disabled={isUpdating}>
                        <FaPlus />
                    </button>
                </div>
            </div>

            {/* Lingue */}
            <div className="interests-group">
                <h3>Lingue</h3>
                <div className="interests-list">
                    {profileData.languages.map((language, index) => (
                        <div key={index} className="interest-item">
                            <span>{language}</span>
                            <button 
                                onClick={() => handleRemoveLanguage(language)}
                                className="remove-btn"
                            >
                                <FaTimes />
                            </button>
                        </div>
                    ))}
                </div>
                <div className="add-interest">
                    <input
                        type="text"
                        value={newLanguage}
                        onChange={(e) => setNewLanguage(e.target.value)}
                        placeholder="Aggiungi una lingua"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddLanguage()}
                    />
                    <button onClick={handleAddLanguage} disabled={isUpdating}>
                        <FaPlus />
                    </button>
                </div>
            </div>

            {/* Cucine Preferite */}
            <div className="interests-group">
                <h3>Cucine Preferite</h3>
                <div className="interests-list">
                    {profileData.preferredCuisine.map((cuisine, index) => (
                        <div key={index} className="interest-item">
                            <span>{cuisine}</span>
                            <button 
                                onClick={() => handleRemoveCuisine(cuisine)}
                                className="remove-btn"
                            >
                                <FaTimes />
                            </button>
                        </div>
                    ))}
                </div>
                <div className="add-interest">
                    <input
                        type="text"
                        value={newCuisine}
                        onChange={(e) => setNewCuisine(e.target.value)}
                        placeholder="Aggiungi una cucina"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddCuisine()}
                    />
                    <button onClick={handleAddCuisine} disabled={isUpdating}>
                        <FaPlus />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InterestsSection;