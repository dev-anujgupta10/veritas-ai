import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import SearchBox from '../components/SearchBox';
import ChatBubble from '../components/ChatBubble';
import SettingsModal from '../components/SettingsModal';
import { Menu, Plus, Sparkles } from 'lucide-react';

const MainChat = ({ user, onLogout, token, theme, setTheme }) => {
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    fetchChats();
  }, [token]);

  const fetchChats = async () => {
    try {
      const res = await axios.get('/api/chat');
      setChats(res.data);
      if (res.data.length > 0 && !currentChatId) {
        selectChat(res.data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch chats', err);
    }
  };

  const selectChat = (chat) => {
    setCurrentChatId(chat._id);
    setMessages(chat.messages);
  };

  const createNewChat = async () => {
    try {
      const res = await axios.post('/api/chat', { title: 'New Verification' });
      setChats([res.data, ...chats]);
      selectChat(res.data);
    } catch (err) {
      console.error('Failed to create chat', err);
    }
  };

  const renameChat = async (id, newTitle) => {
    try {
      await axios.put(`/api/chat/${id}`, { title: newTitle });
      setChats(chats.map(c => c._id === id ? { ...c, title: newTitle } : c));
    } catch (err) {
      console.error('Failed to rename chat', err);
    }
  };

  const deleteChat = async (id) => {
    try {
      await axios.delete(`/api/chat/${id}`);
      setChats(chats.filter(c => c._id !== id));
      if (currentChatId === id) {
        setCurrentChatId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to delete chat', err);
    }
  };

  const deleteAllChats = async () => {
    try {
      await axios.delete('/api/chat/all/clear');
      setChats([]);
      setCurrentChatId(null);
      setMessages([]);
    } catch (err) {
      console.error('Failed to clear chats', err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleVerify = async (text, file) => {
    let chatIdToUse = currentChatId;
    if (!chatIdToUse) {
      try {
        const res = await axios.post('/api/chat', { title: text ? text.substring(0, 30) + '...' : 'Deepfake Check' });
        setChats([res.data, ...chats]);
        chatIdToUse = res.data._id;
        setCurrentChatId(chatIdToUse);
      } catch (err) {
        console.error(err);
        return;
      }
    }

    let imageUrl = null;
    if (file) {
      imageUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
    }

    const newUserMsg = { role: 'user', content: file ? `Uploaded Image to verify` : text, imageUrl };
    setMessages(prev => [...prev, newUserMsg]);
    setLoading(true);

    try {
      let aiResponseData;
      
      if (file) {
        const formData = new FormData();
        formData.append('image', file);
        const res = await axios.post('/api/deepfake', formData);
        aiResponseData = res.data;
      } else {
        const res = await axios.post('/api/verify', { text });
        aiResponseData = res.data;
      }

      const newAiMsg = {
        role: 'ai',
        content: aiResponseData.explanation,
        verdict: aiResponseData.verdict,
        confidence: aiResponseData.confidence,
        summary: aiResponseData.summary || null,
        sources: aiResponseData.sources || []
      };

      setMessages(prev => [...prev, newAiMsg]);

      await axios.put(`/api/chat/${chatIdToUse}/message`, newUserMsg);
      await axios.put(`/api/chat/${chatIdToUse}/message`, newAiMsg);

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'ai', content: 'Verification failed. Please try again.', verdict: 'ERROR', confidence: null, summary: null, sources: [] }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', position: 'relative' }}>
      
      {/* Universal Fixed Top-Left Layout (Visible Only When Sidebar is Closed) */}
      {!isSidebarOpen && (
        <div style={{ position: 'absolute', top: '15px', left: '15px', zIndex: 100, display: 'flex', alignItems: 'center', gap: '10px' }}>
           <h2 className="text-gradient mobile-hide" style={{ margin: 0, fontSize: '20px', fontFamily: 'var(--font-main)' }}>Veritas</h2>
           <div style={{ 
              display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', 
              borderRadius: '99px', padding: '4px', border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)'
           }}>
             <button 
               onClick={() => setSidebarOpen(true)} 
               style={{ padding: '6px 10px', background: 'transparent', color: 'var(--text-primary)', borderRadius: '99px', display: 'flex' }}
               title="Open Sidebar"
             >
               <Menu size={18} />
             </button>
             <button 
               onClick={createNewChat} 
               className="mobile-hide"
               style={{ padding: '6px 10px', background: 'transparent', color: 'var(--text-primary)', borderRadius: '99px', display: 'flex' }}
               title="New Chat"
             >
               <Plus size={18} />
             </button>
           </div>
        </div>
      )}

      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setSidebarOpen}
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={selectChat}
        onNewChat={createNewChat}
        onDeleteChat={deleteChat}
        onRenameChat={renameChat}
        user={user}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', transition: 'margin 0.3s' }}>
        <header className="chat-header" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', marginTop: '10px' }}>
          <div style={{ textAlign: 'center' }}>
            <h1 className="text-gradient" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '24px' }}>
              <Sparkles size={24} color="var(--accent-pink)" /> Veritas AI
            </h1>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>👉 Don't Just Read, Verify.</p>
          </div>
        </header>

        <div className="chat-body" style={{ flex: 1, overflowY: 'auto', padding: '20px', paddingBottom: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {messages.length === 0 ? (
             <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-secondary)', maxWidth: '400px' }}>
               <Sparkles size={48} color="var(--accent-blue)" style={{ opacity: 0.5, marginBottom: '20px' }} />
               <h2>Welcome to Veritas AI</h2>
               <p style={{ marginTop: '10px' }}>Paste a news headline, article paragraph, or upload an image using the + menu to get started.</p>
             </div>
          ) : (
            <div style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {messages.map((msg, idx) => (
                <ChatBubble key={idx} message={msg} />
              ))}
              {loading && <div className="spinner" style={{ margin: '20px auto' }}></div>}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="search-wrapper" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px', display: 'flex', justifyContent: 'center', background: 'linear-gradient(transparent, var(--bg-color) 80%)' }}>
          <div style={{ width: '100%', maxWidth: '800px' }}>
             <SearchBox onSend={handleVerify} disabled={loading} />
          </div>
        </div>
      </div>

      {isSettingsOpen && (
        <SettingsModal 
          onClose={() => setSettingsOpen(false)} 
          theme={theme} 
          setTheme={setTheme} 
          user={user} 
          onLogout={onLogout}
          onDeleteAllChats={deleteAllChats}
        />
      )}
    </div>
  );
};

export default MainChat;
