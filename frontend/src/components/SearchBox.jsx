import React, { useState } from 'react';
import { Send, Plus, X, Image as ImageIcon } from 'lucide-react';

const SearchBox = ({ onSend, disabled }) => {
  const [text, setText] = useState('');
  const [isMenuOpen, setMenuOpen] = useState(false);
  const fileInputRef = React.useRef(null);

  const handleSend = () => {
    if (text.trim() && !disabled) {
      onSend(text, null);
      setText('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && !disabled) {
      onSend('', file);
      setMenuOpen(false);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
      {isMenuOpen && (
        <div className="glass-panel" style={{ position: 'absolute', bottom: '65px', left: '0', padding: '10px', display: 'flex', gap: '10px', zIndex: 10 }}>
          <button 
            disabled={disabled}
            onClick={() => fileInputRef.current?.click()}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderRadius: '8px' }}
          >
             <ImageIcon size={18} color="var(--accent-blue)" /> Deepfake Upload
          </button>
          <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
        </div>
      )}

      <button 
        onClick={() => setMenuOpen(!isMenuOpen)}
        style={{ position: 'absolute', left: '15px', zIndex: 5, background: 'transparent', color: 'var(--text-secondary)' }}
      >
        <Plus size={24} style={{ transform: isMenuOpen ? 'rotate(45deg)' : 'none', transition: '0.2s' }} />
      </button>

      <input 
        type="text" 
        value={text} 
        onChange={(e) => setText(e.target.value)} 
        onKeyDown={handleKeyDown}
        placeholder="Paste news or headline to verify..." 
        disabled={disabled}
        className="glass-panel anim-glow"
        style={{ 
           width: '100%', padding: '18px 85px 18px 50px', fontSize: '16px', 
           background: 'var(--bg-secondary)', color: 'var(--text-primary)',
           borderRadius: '24px', border: '1px solid var(--border-color)',
           boxShadow: 'var(--shadow-lg)', position: 'relative'
        }} 
      />

      <div style={{ position: 'absolute', right: '15px', zIndex: 5, display: 'flex', alignItems: 'center', gap: '5px' }}>
        {text && (
          <button onClick={() => setText('')} style={{ background: 'transparent', color: 'var(--text-secondary)', padding: '5px' }}>
            <X size={20} />
          </button>
        )}
        <button 
           onClick={handleSend}
           disabled={!text.trim() || disabled}
           style={{ 
             background: text.trim() ? 'var(--accent-pink)' : 'var(--bg-tertiary)', 
             color: text.trim() ? '#fff' : 'var(--text-secondary)', 
             padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' 
           }}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default SearchBox;
