import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { messagingAPI } from '../api';
import { ArrowLeft, Send, MessageCircle, Star, Trash2, X, MoreVertical } from 'lucide-react';

export default function MessagesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [showMenu, setShowMenu] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      loadConversations();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation);
      const interval = setInterval(() => {
        loadMessages(activeConversation);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [activeConversation]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = () => setShowMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const loadConversations = () => {
    messagingAPI.listConversations()
      .then((res) => {
        const convData = res.data;
        if (Array.isArray(convData)) {
          setConversations(convData);
        } else if (convData && Array.isArray(convData.results)) {
          setConversations(convData.results);
        } else {
          setConversations([]);
        }
      })
      .catch((err) => {
        console.error('Error loading conversations:', err);
        setConversations([]);
      })
      .finally(() => setLoading(false));
  };

  const loadMessages = (conversationId) => {
    messagingAPI.getMessages(conversationId)
      .then((res) => {
        setMessages(prev => {
          const newMessages = res.data || [];
          if (prev.length === 0 || JSON.stringify(prev) !== JSON.stringify(newMessages)) {
            return newMessages;
          }
          return prev;
        });
        loadConversations();
      })
      .catch((err) => {
        console.error('Error loading messages:', err);
      });
    setActiveConversation(conversationId);
  };

  const sendMessage = (content) => {
    if (!activeConversation || !content.trim()) return;
    messagingAPI.sendMessage(activeConversation, { content })
      .then((res) => {
        setMessages([...messages, res.data]);
        loadConversations();
      })
      .catch((err) => {
        console.error('Error sending message:', err);
      });
  };

  const toggleStar = (e, convId) => {
    e.stopPropagation();
    messagingAPI.starConversation(convId)
      .then(() => {
        loadConversations();
        setShowMenu(null);
      })
      .catch(console.error);
  };

  const deleteConversation = (e, convId) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      messagingAPI.deleteConversation(convId)
        .then(() => {
          if (activeConversation === convId) {
            setActiveConversation(null);
          }
          loadConversations();
          setShowMenu(null);
        })
        .catch(console.error);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    sendMessage(newMessage);
    setNewMessage('');
  };

  const getOtherParticipant = (conv) => {
    if (!conv.participants || !user) return { name: 'Unknown', initial: '?' };
    const other = conv.participants.find(p => p.id !== user.id);
    if (other) {
      return {
        name: other.first_name || other.email,
        initial: (other.first_name || other.email)[0]?.toUpperCase()
      };
    }
    return { name: 'Unknown', initial: '?' };
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pattern-light">
        <div className="animate-spin w-8 h-8 border-4 border-black border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pattern-light">
      <div className="bg-gradient-hero text-white py-4 px-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="hover:bg-white/10 p-2 rounded-lg transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold">Messages</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto bg-white shadow-xl min-h-[calc(100vh-64px)] rounded-t-3xl overflow-hidden">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-20">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mb-6">
              <MessageCircle className="w-12 h-12 text-gray-500" />
            </div>
            <p className="text-gray-600 text-lg font-medium mb-2">No conversations yet</p>
            <p className="text-gray-400">Accept a swap to start chatting</p>
          </div>
        ) : (
          <div className="flex h-[calc(100vh-64px)]">
            {/* Conversations List */}
            <div className={`w-full md:w-80 border-r bg-gray-50 ${activeConversation ? 'hidden md:block' : ''}`}>
              <div className="overflow-y-auto h-full">
                {conversations.map((conv) => {
                  const other = getOtherParticipant(conv);
                  const unread = conv.unread_count || 0;
                  const isStarred = conv.starred_by?.some(u => u.id === user?.id);
                  return (
                    <div
                      key={conv.id}
                      onClick={() => loadMessages(conv.id)}
                      className={`flex items-center p-4 cursor-pointer hover:bg-white border-b transition-colors ${
                        activeConversation === conv.id ? 'bg-white border-l-4 border-l-black' : ''
                      }`}
                    >
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {other.initial}
                        </div>
                        {unread > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                            {unread > 9 ? '9+' : unread}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 ml-3">
                        <div className="flex justify-between items-baseline">
                          <p className={`font-semibold truncate flex items-center gap-1 ${unread > 0 ? 'text-black' : 'text-gray-700'}`}>
                            {isStarred && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                            {other.name}
                          </p>
                          <div className="flex items-center gap-2">
                            {conv.last_message && (
                              <span className={`text-xs ${unread > 0 ? 'text-black font-medium' : 'text-gray-400'}`}>
                                {formatTime(conv.last_message.created_at)}
                              </span>
                            )}
                            <div className="relative">
                              <button
                                onClick={(e) => { e.stopPropagation(); setShowMenu(showMenu === conv.id ? null : conv.id); }}
                                className="p-1 hover:bg-gray-100 rounded"
                              >
                                <MoreVertical className="w-4 h-4 text-gray-400" />
                              </button>
                              {showMenu === conv.id && (
                                <div className="absolute right-0 top-8 bg-white shadow-lg border rounded-lg py-1 z-10 w-36">
                                  <button
                                    onClick={(e) => toggleStar(e, conv.id)}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                  >
                                    <Star className={`w-4 h-4 ${isStarred ? 'text-yellow-500 fill-yellow-500' : 'text-gray-500'}`} />
                                    {isStarred ? 'Unstar' : 'Star'}
                                  </button>
                                  <button
                                    onClick={(e) => deleteConversation(e, conv.id)}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        {conv.last_message && (
                          <p className={`text-sm truncate ${unread > 0 ? 'text-black font-medium' : 'text-gray-500'}`}>
                            {conv.last_message.sender.id === user?.id ? 'You: ' : ''}
                            {conv.last_message.content}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chat Area */}
            <div className={`w-full md:flex-1 flex flex-col ${!activeConversation ? 'hidden md:flex' : ''}`}>
              {activeConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="bg-white p-4 border-b flex items-center gap-3 shadow-sm">
                    <button
                      onClick={() => setActiveConversation(null)}
                      className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    {(() => {
                      const conv = conversations.find(c => c.id === activeConversation);
                      const other = conv ? getOtherParticipant(conv) : { name: 'Unknown', initial: '?' };
                      return (
                        <>
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {other.initial}
                          </div>
                          <div>
                            <p className="font-semibold">{other.name}</p>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                    {messages.map((msg) => {
                      const isOwnMessage = msg.sender && msg.sender.id === user?.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                              isOwnMessage
                                ? 'bg-gradient-to-r from-black to-gray-800 text-white rounded-br-sm'
                                : 'bg-white text-gray-900 rounded-bl-sm shadow border border-gray-100'
                            }`}
                          >
                            <p>{msg.content}</p>
                            <p className={`text-xs mt-1 ${isOwnMessage ? 'text-gray-400' : 'text-gray-400'}`}>
                              {formatTime(msg.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <form onSubmit={handleSend} className="p-4 bg-white border-t flex gap-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-5 py-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="bg-gradient-to-r from-black to-gray-800 text-white p-3 rounded-full disabled:bg-gray-300 hover:shadow-lg transition-shadow"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="w-10 h-10 text-gray-400" />
                    </div>
                    <p>Select a conversation to start chatting</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
