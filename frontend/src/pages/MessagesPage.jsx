import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { messagingAPI } from '../api';
import { ArrowLeft, Send } from 'lucide-react';

export default function MessagesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
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
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

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
        setMessages(res.data || []);
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
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin w-8 h-8 border-4 border-black border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-black text-white py-4 px-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold">Messages</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto bg-white shadow-lg min-h-[calc(100vh-64px)]">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-4xl">💬</span>
            </div>
            <p className="text-gray-500 text-lg">No conversations yet</p>
            <p className="text-gray-400 text-sm">Accept a swap to start chatting</p>
          </div>
        ) : (
          <div className="flex h-[calc(100vh-64px)]">
            {/* Conversations List */}
            <div className={`w-full md:w-1/3 border-r ${activeConversation ? 'hidden md:block' : ''}`}>
              <div className="overflow-y-auto h-full">
                {conversations.map((conv) => {
                  const other = getOtherParticipant(conv);
                  return (
                    <div
                      key={conv.id}
                      onClick={() => loadMessages(conv.id)}
                      className={`flex items-center p-4 cursor-pointer hover:bg-gray-50 border-b ${
                        activeConversation === conv.id ? 'bg-gray-100' : ''
                      }`}
                    >
                      <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white font-semibold mr-3">
                        {other.initial}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <p className="font-semibold truncate">{other.name}</p>
                          {conv.last_message && (
                            <span className="text-xs text-gray-400">
                              {formatTime(conv.last_message.created_at)}
                            </span>
                          )}
                        </div>
                        {conv.last_message && (
                          <p className="text-sm text-gray-500 truncate">
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
            <div className={`w-full md:w-2/3 flex flex-col ${!activeConversation ? 'hidden md:flex' : ''}`}>
              {activeConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="bg-gray-100 p-4 border-b flex items-center gap-3">
                    <button
                      onClick={() => setActiveConversation(null)}
                      className="md:hidden"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    {(() => {
                      const conv = conversations.find(c => c.id === activeConversation);
                      const other = conv ? getOtherParticipant(conv) : { name: 'Unknown', initial: '?' };
                      return (
                        <>
                          <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white font-semibold">
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
                  <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
                    {messages.map((msg) => {
                      const isOwnMessage = msg.sender && msg.sender.id === user?.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                              isOwnMessage
                                ? 'bg-black text-white rounded-br-sm'
                                : 'bg-white text-gray-900 rounded-bl-sm shadow border'
                            }`}
                          >
                            <p>{msg.content}</p>
                            <p className={`text-xs mt-1 ${
                              isOwnMessage ? 'text-gray-400' : 'text-gray-400'
                            }`}>
                              {formatTime(msg.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <form onSubmit={handleSend} className="p-4 bg-white border-t flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:border-black"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="bg-black text-white p-2 rounded-full disabled:bg-gray-300"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <p className="text-4xl mb-2">💬</p>
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
