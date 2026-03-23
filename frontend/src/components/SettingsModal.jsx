import React, { useState } from 'react';
import { X, Moon, Sun, Trash2, LogOut } from 'lucide-react';
import axios from 'axios';
import ConfirmModal from './ConfirmModal';

const SettingsModal = ({ onClose, theme, setTheme, user, onLogout, onDeleteAllChats }) => {
  const [tab, setTab] = useState('General');
  const [confirmAction, setConfirmAction] = useState(null); // 'logout', 'delete-account', 'clear-chats'

  const confirmActionHandlers = {
    'delete-account': async () => {
      try {
        await axios.delete(`/api/auth/delete-account/${user.id}`);
        onLogout();
      } catch (err) {
        console.error('Delete account failed', err);
      }
    },
    'clear-chats': () => {
      onDeleteAllChats();
      setConfirmAction(null);
    },
    'logout': async () => {
      try {
        await axios.post('/api/auth/logout');
      } catch (err) {
        console.error('Logout failed', err);
      }
      onLogout();
    }
  };

  const getModalProps = () => {
    switch(confirmAction) {
      case 'delete-account':
        return {
          title: "Delete Account?",
          description: "Are you sure you want to delete your account? This action cannot be undone and all data will be lost.",
          confirmText: "Delete Account"
        };
      case 'clear-chats':
        return {
          title: "Delete all chats?",
          description: "All chat history will be permanently deleted and cannot be recovered. Any shared links will be disabled.",
          confirmText: "Confirm deletion"
        };
      case 'logout':
        return {
          title: "Log out of all devices?",
          description: "Clicking 'Confirm Logout' will sign you out of all devices and browsers, including this device.",
          confirmText: "Confirm Logout"
        };
      default:
        return {};
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="settings-modal-content" style={{ background: 'var(--bg-secondary)', borderRadius: '16px', boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'row', height: '400px', overflow: 'hidden' }}>
        
        <div className="settings-sidebar" style={{ width: '200px', background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)' }}>
          <div style={{ padding: '20px', fontSize: '18px', fontWeight: '600', borderBottom: '1px solid var(--border-color)' }}>Settings</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
             {['General', 'Profile', 'Data'].map(t => (
               <button 
                 key={t}
                 onClick={() => setTab(t)}
                 style={{ padding: '15px 20px', textAlign: 'left', background: tab === t ? 'var(--bg-tertiary)' : 'transparent', color: tab === t ? 'var(--text-primary)' : 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', outline: 'none' }}
               >
                 {t}
               </button>
             ))}
          </div>
        </div>

        <div style={{ flex: 1, padding: '30px', position: 'relative' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', color: 'var(--text-secondary)' }}><X size={20} /></button>
          
          <h2 style={{ marginBottom: '25px', fontSize: '20px' }}>{tab} Settings</h2>

          {tab === 'General' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 0', borderBottom: '1px solid var(--border-color)' }}>
                <span>Theme</span>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setTheme('light')} style={{ padding: '8px 12px', borderRadius: '8px', background: theme === 'light' ? 'var(--accent-blue)' : 'var(--bg-tertiary)', color: theme === 'light' ? '#fff' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}><Sun size={16}/> Light</button>
                  <button onClick={() => setTheme('dark')} style={{ padding: '8px 12px', borderRadius: '8px', background: theme === 'dark' ? 'var(--accent-pink)' : 'var(--bg-tertiary)', color: theme === 'dark' ? '#fff' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}><Moon size={16}/> Dark</button>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 0' }}>
                <span>Language</span>
                <select style={{ padding: '8px', borderRadius: '8px', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', outline: 'none' }}>
                  <option>English</option>
                  <option>Spanish</option>
                </select>
              </div>
            </div>
          )}

          {tab === 'Profile' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '5px' }}>Name</p>
                <div style={{ padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>{user?.name}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button onClick={() => setConfirmAction('logout')} style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}><LogOut size={16} /> Logout</button>
                <button onClick={() => setConfirmAction('delete-account')} style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255, 107, 107, 0.1)', color: 'var(--accent-red)', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid var(--accent-red)' }}><Trash2 size={16} /> Delete Account</button>
              </div>
            </div>
          )}

          {tab === 'Data' && (
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>Manage your chat history and data saved with Veritas AI.</p>
              <button onClick={() => setConfirmAction('clear-chats')} style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255, 107, 107, 0.1)', color: 'var(--accent-red)', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid var(--accent-red)', width: '100%' }}>
                <Trash2 size={16} /> Delete All Chats
              </button>
            </div>
          )}
        </div>
      </div>
      <ConfirmModal 
        isOpen={!!confirmAction} 
        onCancel={() => setConfirmAction(null)} 
        onConfirm={confirmActionHandlers[confirmAction] || (() => {})} 
        {...getModalProps()} 
      />
    </div>
  );
};

export default SettingsModal;
