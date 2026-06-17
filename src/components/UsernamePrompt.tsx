import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { saveUsername, validateUsername } from '../game/storage';
import './UsernamePrompt.css';

interface UsernamePromptProps {
  onComplete: (name: string) => void;
}

export function UsernamePrompt({ onComplete }: UsernamePromptProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const validationError = validateUsername(name);
    if (validationError) {
      setError(validationError);
      return;
    }
    onComplete(saveUsername(name.trim()));
  };

  return (
    <div className="username-prompt">
      <motion.div
        className="username-prompt__card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="username-title"
        initial={{ scale: 0.9, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 420, damping: 28 }}
      >
        <div className="username-prompt__glow" aria-hidden />
        <span className="username-prompt__emoji" aria-hidden>
          🪐
        </span>
        <h1 id="username-title" className="username-prompt__title">
          RenkOrbit
        </h1>
        <p className="username-prompt__sub">Galaksi yolculuğuna hoş geldin! Oyuncu adını seç.</p>

        <form className="username-prompt__form" onSubmit={handleSubmit}>
          <input
            type="text"
            className="username-prompt__input"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            placeholder="Oyuncu adı"
            maxLength={16}
            autoComplete="nickname"
            autoFocus
          />
          {error && <p className="username-prompt__error">{error}</p>}
          <button type="submit" className="username-prompt__btn">
            Başla
          </button>
        </form>
      </motion.div>
    </div>
  );
}
