import React from 'react';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'fr', label: 'FR' },
  { code: 'ru', label: 'RU' }
];

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (e) => {
    const lang = e.target.value;
    i18n.changeLanguage(lang);
    localStorage.setItem('lang', lang);
  };

  return (
    <select
      value={i18n.resolvedLanguage || i18n.language}
      onChange={changeLanguage}
      style={{ background: '#1f2937', color: 'white', border: '1px solid #374151', borderRadius: 6, padding: '0.4rem 0.6rem' }}
    >
      {LANGUAGES.map(({ code, label }) => (
        <option key={code} value={code}>{label}</option>
      ))}
    </select>
  );
};

export default LanguageSwitcher;
