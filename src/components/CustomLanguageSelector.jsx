import React, { useState, useRef, useEffect } from 'react';

const CustomLanguageSelector = ({ language, setLanguage, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const languages = [
    { label: 'Indian Regional', options: [
      { code: 'hi-IN', name: 'हिन्दी (Hindi)' },
      { code: 'en-IN', name: 'English (India)' },
      { code: 'bn-IN', name: 'বাংলা (Bengali)' },
      { code: 'mr-IN', name: 'मराठी (Marathi)' },
      { code: 'te-IN', name: 'తెలుగు (Telugu)' },
      { code: 'ta-IN', name: 'தமிழ் (Tamil)' },
      { code: 'gu-IN', name: 'ગુજરાતી (Gujarati)' },
      { code: 'kn-IN', name: 'ಕನ್ನಡ (Kannada)' },
      { code: 'ml-IN', name: 'മലയാളം (Malayalam)' },
      { code: 'pa-IN', name: 'ਪੰਜਾਬੀ (Punjabi)' }
    ]},
    { label: 'International', options: [
      { code: 'en-US', name: 'English (US)' },
      { code: 'es-ES', name: 'Español (Spanish)' },
      { code: 'fr-FR', name: 'Français (French)' },
      { code: 'ar-SA', name: 'العربية (Arabic)' },
      { code: 'zh-CN', name: '中文 (Mandarin)' },
      { code: 'ja-JP', name: '日本語 (Japanese)' },
      { code: 'de-DE', name: 'Deutsch (German)' },
      { code: 'it-IT', name: 'Italiano (Italian)' }
    ]}
  ];

  const getLanguageName = (code) => {
    for (const group of languages) {
      const found = group.options.find(opt => opt.code === code);
      if (found) return found.name;
    }
    return code; // Fallback
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} style={{ position: 'relative', flex: 1, minWidth: '150px' }}>
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          padding: '0.8rem 1rem',
          borderRadius: '8px',
          backgroundColor: '#0b0f19',
          color: '#fff',
          border: '1px solid var(--glass-border)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          opacity: disabled ? 0.5 : 1
        }}
      >
        <span>{getLanguageName(language)}</span>
        <span style={{ fontSize: '10px' }}>{isOpen ? '▲' : '▼'}</span>
      </div>
      
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '0.5rem',
          backgroundColor: '#0b0f19',
          border: '1px solid var(--glass-border)',
          borderRadius: '8px',
          zIndex: 1000,
          maxHeight: '300px',
          overflowY: 'auto',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
        }}>
          {languages.map((group, i) => (
            <div key={i}>
              <div style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', color: '#66cfdf', backgroundColor: 'rgba(255,255,255,0.05)', fontWeight: 'bold' }}>
                {group.label}
              </div>
              {group.options.map(opt => (
                <div 
                  key={opt.code}
                  onClick={() => {
                    setLanguage(opt.code);
                    setIsOpen(false);
                  }}
                  style={{
                    padding: '0.6rem 1rem',
                    color: language === opt.code ? '#00e5ff' : '#fff',
                    backgroundColor: language === opt.code ? 'rgba(0, 229, 255, 0.1)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (language !== opt.code) e.target.style.backgroundColor = 'rgba(255,255,255,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    if (language !== opt.code) e.target.style.backgroundColor = 'transparent';
                  }}
                >
                  {opt.name}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomLanguageSelector;
