import React, { useEffect, useState } from 'react';

const ConfirmModal = ({ 
  isOpen, 
  title, 
  description, 
  onConfirm, 
  onCancel, 
  confirmText = "Confirm", 
  cancelText = "Cancel" 
}) => {
  const [render, setRender] = useState(isOpen);

  // Parse **text** into <strong>text</strong>
  const parseBoldText = (text) => {
    if (!text || typeof text !== 'string') return text;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} style={{ color: 'var(--text-primary)' }}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  useEffect(() => {
    if (isOpen) setRender(true);
  }, [isOpen]);

  const onAnimationEnd = () => {
    if (!isOpen) setRender(false);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!render) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: isOpen ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0)',
        backdropFilter: 'blur(4px)',
        zIndex: 999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 0.3s ease',
      }}
      onClick={onCancel}
      onTransitionEnd={onAnimationEnd}
    >
      <div 
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '32px',
          width: '90%',
          maxWidth: '400px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          transform: isOpen ? 'scale(1)' : 'scale(0.95)',
          opacity: isOpen ? 1 : 0,
          transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
          {title}
        </h2>
        
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
          {parseBoldText(description)}
        </p>

        <div style={{ display: 'flex', gap: '12px', marginTop: '16px', justifyContent: 'flex-end' }}>
          <button 
            onClick={onCancel}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--text-secondary)',
              fontWeight: '500',
            }}
          >
            {cancelText}
          </button>
          
          <button 
            onClick={onConfirm}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              background: 'rgba(255, 107, 107, 0.15)',
              color: 'var(--accent-red)',
              border: '1px solid var(--accent-red)',
              fontWeight: '600',
              boxShadow: '0 0 15px rgba(255, 107, 107, 0.2)',
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
