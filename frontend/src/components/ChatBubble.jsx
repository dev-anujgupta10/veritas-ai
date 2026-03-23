import React from 'react';
import { User, ShieldCheck, ShieldAlert, AlertTriangle, ExternalLink, ClipboardList } from 'lucide-react';

const VERDICT_CONFIG = {
  'TRUE': {
    color: 'var(--accent-green)',
    bg: 'rgba(46, 204, 113, 0.08)',
    border: 'rgba(46, 204, 113, 0.3)',
    icon: <ShieldCheck size={18} />,
    label: '✅ Verified TRUE',
  },
  'FALSE': {
    color: 'var(--accent-red)',
    bg: 'rgba(255, 107, 107, 0.08)',
    border: 'rgba(255, 107, 107, 0.3)',
    icon: <ShieldAlert size={18} />,
    label: '❌ FALSE / Debunked',
  },
  'MISLEADING': {
    color: '#F39C12',
    bg: 'rgba(243, 156, 18, 0.08)',
    border: 'rgba(243, 156, 18, 0.3)',
    icon: <AlertTriangle size={18} />,
    label: '⚠️ MISLEADING',
  },
  'AI-GENERATED / DEEPFAKE': {
    color: 'var(--accent-red)',
    bg: 'rgba(255, 107, 107, 0.08)',
    border: 'rgba(255, 107, 107, 0.3)',
    icon: <ShieldAlert size={18} />,
    label: '🤖 AI-Generated / Deepfake',
  },
  'REAL IMAGE': {
    color: 'var(--accent-green)',
    bg: 'rgba(46, 204, 113, 0.08)',
    border: 'rgba(46, 204, 113, 0.3)',
    icon: <ShieldCheck size={18} />,
    label: '📷 Real Image',
  },
};

const ConfidenceBar = ({ confidence, color }) => {
  const [width, setWidth] = React.useState(0);

  React.useEffect(() => {
    // Small timeout to allow the initial 0% width to render before triggering the transition
    const timer = setTimeout(() => {
      setWidth(Math.min(100, Math.max(0, confidence)));
    }, 50);
    return () => clearTimeout(timer);
  }, [confidence]);

  return (
    <div style={{ marginTop: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
        <span>Confidence</span>
        <span style={{ color, fontWeight: '600' }}>{confidence}%</span>
      </div>
      <div style={{ background: 'var(--bg-tertiary)', borderRadius: '99px', height: '8px', overflow: 'hidden', width: '100%' }}>
        <div style={{
          height: '100%', 
          borderRadius: '99px',
          backgroundColor: color,
          width: `${width}%`,
          transition: 'all 0.5s ease-in-out',
        }} />
      </div>
    </div>
  );
};

const ChatBubble = ({ message }) => {
  const isUser = message.role === 'user';
  const isError = message.verdict === 'ERROR';
  const cfg = !isUser && !isError ? (VERDICT_CONFIG[message.verdict] || {
    color: 'var(--accent-blue)',
    bg: 'rgba(127, 179, 213, 0.08)',
    border: 'rgba(127, 179, 213, 0.3)',
    icon: <ClipboardList size={18} />,
    label: message.verdict || 'Analysis',
  }) : null;

  const rawConfidence = typeof message.confidence === 'number'
    ? message.confidence
    : parseInt(message.confidence, 10);
    
  const confidence = isNaN(rawConfidence) ? null : Math.min(100, Math.max(0, rawConfidence));

  return (
    <div style={{ display: 'flex', flexDirection: isUser ? 'row-reverse' : 'row', gap: '12px', width: '100%' }}>
      {/* Avatar */}
      <div style={{
        width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: isUser
          ? 'var(--bg-tertiary)'
          : 'linear-gradient(135deg, var(--accent-pink), var(--accent-blue))',
        color: '#fff', fontWeight: 'bold', fontSize: '14px',
      }}>
        {isUser ? <User size={18} /> : 'V'}
      </div>

      {/* Bubble */}
      <div style={{
        maxWidth: '80%', borderRadius: '16px',
        background: isUser ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
        border: isUser ? 'none' : `1px solid var(--border-color)`,
        padding: '16px', color: 'var(--text-primary)',
        boxShadow: isUser ? 'none' : 'var(--shadow-sm)',
      }}>
        {/* Verdict Header */}
        {!isUser && cfg && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '8px 14px', borderRadius: '20px', marginBottom: '14px',
            background: cfg.bg, border: `1px solid ${cfg.border}`,
            color: cfg.color, fontWeight: '700', fontSize: '14px',
          }}>
            {cfg.icon} {cfg.label}
            {confidence !== null && (
              <span style={{
                marginLeft: '8px', background: 'var(--bg-tertiary)',
                padding: '2px 10px', borderRadius: '12px', fontSize: '13px',
                color: cfg.color, fontWeight: '600'
              }}>
                {confidence}% Certain
              </span>
            )}
          </div>
        )}

        {/* Confidence bar for AI messages */}
        {!isUser && confidence !== null && (
          <ConfidenceBar confidence={confidence} color={cfg?.color || 'var(--accent-blue)'} />
        )}

        {/* Explanation or Image Preview */}
        {isUser && message.imageUrl ? (
          <img src={message.imageUrl} alt="Upload Preview" style={{ maxHeight: '250px', borderRadius: '12px', objectFit: 'contain', display: 'block' }} />
        ) : (
          <div style={{ lineHeight: '1.65', whiteSpace: 'pre-wrap', marginTop: (!isUser && !isError) ? '12px' : '0', fontSize: '14px', color: isError ? 'var(--accent-red)' : 'var(--text-primary)' }}>
            {message.content}
          </div>
        )}

        {/* Summary box (only for TRUE verdicts) */}
        {!isUser && message.summary && (
          <div style={{
            marginTop: '16px', padding: '14px', borderRadius: '10px',
            background: 'rgba(46, 204, 113, 0.05)',
            border: '1px solid rgba(46, 204, 113, 0.2)',
          }}>
            <p style={{ fontSize: '12px', color: 'var(--accent-green)', fontWeight: '600', marginBottom: '6px' }}>📋 Summary</p>
            <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-primary)' }}>{message.summary}</p>
          </div>
        )}

        {/* Sources */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border-color)' }}>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sources Referenced</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {message.sources.map((s, idx) => (
                <div key={idx} style={{ fontSize: '13px', color: 'var(--accent-blue)', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                  <ExternalLink size={13} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>
                    <span style={{ fontWeight: '500', color: 'var(--text-secondary)', marginRight: '4px' }}>[{s.name || new URL(s.url || s.link || 'http://unknown').hostname.replace('www.', '')}]</span>
                    {(s.url || s.link)
                      ? <a href={s.url || s.link} target="_blank" rel="noreferrer" className="source-link">{s.title || (s.url || s.link)}</a>
                      : <span>{s.title}</span>
                    }
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatBubble;
