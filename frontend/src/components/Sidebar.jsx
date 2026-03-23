import React from 'react';
import { Plus, X, MessageSquare, Trash2, Settings, HelpCircle, MoreVertical, MoreHorizontal, Edit2, Pin, Share2 } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

const Sidebar = ({ isOpen, setIsOpen, chats, currentChatId, onSelectChat, onNewChat, onDeleteChat, onRenameChat, user, onOpenSettings }) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [hoveredChatId, setHoveredChatId] = React.useState(null);
  const [activeMenuId, setActiveMenuId] = React.useState(null);
  const [chatToDelete, setChatToDelete] = React.useState(null);
  const [editingChatId, setEditingChatId] = React.useState(null);
  const [editingTitle, setEditingTitle] = React.useState("");
  const [toastMsg, setToastMsg] = React.useState("");

  React.useEffect(() => {
    const handleGlobalClick = () => setActiveMenuId(null);
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  const handleRenameInit = (chat) => {
    setEditingChatId(chat._id);
    setEditingTitle(chat.title);
    setActiveMenuId(null);
  };

  const handleRenameSubmit = () => {
    if (editingChatId && editingTitle.trim() !== '') {
      onRenameChat(editingChatId, editingTitle.trim());
    }
    setEditingChatId(null);
  };

  const handleShare = (chat) => {
    setActiveMenuId(null);
    const link = `${window.location.origin}/share/${chat._id}`;
    navigator.clipboard.writeText(link);
    setToastMsg('Link copied to clipboard!');
    setTimeout(() => setToastMsg(''), 2500);
  };

  return (
    <div style={{
      width: isOpen ? '280px' : '0px',
      transition: 'width 0.3s ease',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden', flexShrink: 0
    }}>
      <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="text-gradient" style={{ margin: 0, fontSize: '20px' }}>Veritas</h2>
        <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', color: 'var(--text-secondary)' }}>
          <X size={20} />
        </button>
      </div>

      <div style={{ padding: '0 15px', marginBottom: '15px' }}>
        <button 
          onClick={onNewChat}
          style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '500' }}
        >
          <Plus size={18} /> New Chat
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 15px' }}>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px', paddingLeft: '5px' }}>History</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {chats.map(chat => (
            <div 
               key={chat._id} 
               onMouseEnter={() => setHoveredChatId(chat._id)}
               onMouseLeave={() => setHoveredChatId(null)}
               style={{
                 padding: '10px 12px', borderRadius: '8px', cursor: 'pointer',
                 background: currentChatId === chat._id ? 'var(--bg-tertiary)' : 'transparent',
                 display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                 color: currentChatId === chat._id ? 'var(--text-primary)' : 'var(--text-secondary)'
               }}
            >
              <div onClick={() => onSelectChat(chat)} style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden', flex: 1 }}>
                <MessageSquare size={16} flexShrink={0} />
                {editingChatId === chat._id ? (
                  <input 
                    autoFocus
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={handleRenameSubmit}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameSubmit();
                      if (e.key === 'Escape') setEditingChatId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    style={{ 
                      background: 'var(--bg-secondary)', color: 'var(--text-primary)', 
                      border: `1px solid var(--accent-blue)`, outline: 'none', 
                      width: '100%', fontSize: '14px', padding: '2px 6px', borderRadius: '4px' 
                    }}
                  />
                ) : (
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '14px' }}>
                    {chat.title}
                  </span>
                )}
              </div>
              
              {(hoveredChatId === chat._id || activeMenuId === chat._id) && (
                <div style={{ position: 'relative' }}>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === chat._id ? null : chat._id); }} 
                    style={{ background: 'transparent', color: 'var(--text-secondary)', padding: '4px', borderRadius: '4px' }}
                    className="hover-bg-tertiary"
                  >
                    <MoreHorizontal size={16} />
                  </button>
                  
                  {activeMenuId === chat._id && (
                    <div 
                       onClick={(e) => e.stopPropagation()}
                       style={{ 
                         position: 'absolute', right: '0', top: '100%', marginTop: '4px', 
                         background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', 
                         borderRadius: '8px', padding: '6px', minWidth: '130px', zIndex: 50,
                         boxShadow: '0 4px 12px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '2px' 
                       }}
                    >
                      <button onClick={(e) => { e.stopPropagation(); handleRenameInit(chat); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', background: 'transparent', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '13px', textAlign: 'left', width: '100%' }} className="hover-bg-tertiary">
                        <Edit2 size={14} /> Rename
                      </button>
                      <button onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', background: 'transparent', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '13px', textAlign: 'left', width: '100%' }} className="hover-bg-tertiary">
                        <Pin size={14} /> Pin
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleShare(chat); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', background: 'transparent', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '13px', textAlign: 'left', width: '100%' }} className="hover-bg-tertiary">
                        <Share2 size={14} /> Share
                      </button>
                      <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />
                      <button 
                        onClick={() => { setChatToDelete(chat); setActiveMenuId(null); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', background: 'rgba(255, 107, 107, 0.1)', color: 'var(--accent-red)', borderRadius: '6px', fontSize: '13px', textAlign: 'left', width: '100%' }}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '15px', borderTop: '1px solid var(--border-color)', position: 'relative' }}>
        {menuOpen && (
          <div className="glass-panel" style={{ position: 'absolute', bottom: '70px', right: '15px', left: '15px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '5px', zIndex: 10 }}>
             <button onClick={() => { setMenuOpen(false); onOpenSettings(); }} style={{ padding: '10px', background: 'transparent', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', width: '100%', textAlign: 'left', borderRadius: '6px' }}><Settings size={16}/> Settings</button>
             <button style={{ padding: '10px', background: 'transparent', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', width: '100%', textAlign: 'left', borderRadius: '6px' }}><HelpCircle size={16}/> Help & Feedback</button>
          </div>
        )}
        <div 
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '8px', cursor: 'pointer', background: menuOpen ? 'var(--bg-tertiary)' : 'transparent' }}
        >
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(45deg, var(--accent-pink), var(--accent-red))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <span style={{ flex: 1, fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>{user?.name || 'User'}</span>
          <MoreVertical size={18} color="var(--text-secondary)" />
        </div>
      </div>

      <ConfirmModal 
        isOpen={!!chatToDelete} 
        onCancel={() => setChatToDelete(null)} 
        onConfirm={() => {
           if (chatToDelete) onDeleteChat(chatToDelete._id);
           setChatToDelete(null);
        }} 
        title="Delete chat?"
        description={`This will delete **${chatToDelete?.title}**.`}
        confirmText="Delete"
      />

      {toastMsg && (
        <div style={{
          position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000,
          background: 'var(--bg-tertiary)', color: 'var(--text-primary)', 
          padding: '12px 20px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <Share2 size={16} color="var(--accent-blue)" /> {toastMsg}
        </div>
      )}
    </div>
  );
};

export default Sidebar;
