import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ArrowLeft, MoreVertical, Phone, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDatabase, ref, push, onValue, query, limitToLast, serverTimestamp, update, remove } from 'firebase/database';
import { Trash2 } from 'lucide-react';
import { db } from '../src/firebaseConfig';

interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: number;
}

const Message: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, hasPermission } = useAuth();
  const [view, setView] = useState<'inbox' | 'compose'>('inbox');
  const [users, setUsers] = useState<{ id: string; displayName: string; email: string }[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [recipientId, setRecipientId] = useState('');
  const [subject, setSubject] = useState(''); // Optional subject visual
  const [input, setInput] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  if (currentUser && !hasPermission('canViewMessages')) {
    return (
      <div className="h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-sm">
          <div className="text-4xl mb-4">🚫</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-500">You do not have permission to view messages.</p>
          <button onClick={() => navigate('/')} className="mt-6 px-6 py-2 bg-gray-800 text-white rounded-lg">Go Home</button>
        </div>
      </div>
    );
  }

  // Fetch Users
  useEffect(() => {
    const usersRef = ref(db, 'users');
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const userList = Object.entries(data).map(([key, value]: [string, any]) => ({
          id: key,
          displayName: value.displayName || value.email || 'Unknown User',
          email: value.email
        }));
        // Filter out self? Or keep for self-notes?
        setUsers(userList.filter(u => u.id !== currentUser?.uid));
      }
    });
  }, [currentUser]);

  // Fetch Messages (Simulated Inbox Query)
  useEffect(() => {
    if (!currentUser) return;
    const messagesRef = query(ref(db, 'messages/private'), limitToLast(100)); // Using 'private' node
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedMessages = Object.entries(data).map(([key, value]: [string, any]) => ({
          id: key,
          ...value,
        })).filter(msg => msg.recipientId === currentUser.uid || msg.senderId === currentUser.uid)
          .sort((a, b) => b.timestamp - a.timestamp); // Newest first
        setMessages(loadedMessages);
      } else {
        setMessages([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [currentUser]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !recipientId || !currentUser) return;

    try {
      if (editingId) {
        // Edit logic
        // Check if eligible (done in UI, but double check?)
        await update(ref(db, `messages/private/${editingId}`), {
          text: input,
          isEdited: true
        });
        setEditingId(null);
        setView('inbox');
      } else {
        const recipientName = users.find(u => u.id === recipientId)?.displayName || 'Unknown';
        await push(ref(db, 'messages/private'), {
          text: input,
          senderId: currentUser.uid,
          senderName: currentUser.displayName || 'User',
          recipientId: recipientId,
          recipientName: recipientName,
          timestamp: serverTimestamp(),
        });
      }
      setInput('');
      setView('inbox');
      // setRecipientId(''); // Keep recipient for rapid fire? Better to clear.
    } catch (error) {
      console.error("Error sending:", error);
    }
  };

  const handleEdit = (msg: any) => {
    setEditingId(msg.id);
    setInput(msg.text);
    setRecipientId(msg.recipientId); // Or Sender?
    // If I am editing, I am the sender, so recipient is msg.recipientId
    setView('compose');
  };

  // Helper: Can edit? (Is Sender, Is < 1 hour)
  const canEdit = (msg: any) => {
    if (msg.senderId !== currentUser?.uid) return false;
    const oneHour = 60 * 60 * 1000;
    return (Date.now() - msg.timestamp) < oneHour;
  };

  const handleDelete = async (msgId: string) => {
    if (window.confirm("Delete this message?")) { // using window.confirm for explicit browser dialog
      try {
        await remove(ref(db, `messages/private/${msgId}`));
      } catch (error) {
        console.error("Error deleting:", error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 md:p-8 font-sans">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-xl overflow-hidden min-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 p-6 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="hover:bg-gray-100 p-2 rounded-full transition-colors text-gray-500">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Mailbox</h1>
          </div>
          {view === 'inbox' && (
            <button
              onClick={() => {
                setEditingId(null);
                setInput('');
                setRecipientId('');
                setView('compose');
              }}
              className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-md"
            >
              <span className="text-xl">+</span> Compose
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {view === 'inbox' ? (
            <div className="divide-y divide-gray-100">
              {loading ? (
                <div className="p-10 text-center text-gray-400">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400 opacity-60">
                  <div className="text-6xl mb-4">📭</div>
                  <p className="text-lg">No messages found</p>
                </div>
              ) : (
                messages.map(msg => (
                  <div key={msg.id} className="p-6 hover:bg-gray-50 transition-colors group relative">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${msg.senderId === currentUser?.uid ? 'bg-rose-400' : 'bg-blue-400'
                          }`}>
                          {msg.senderId === currentUser?.uid ? 'Me' : msg.senderName?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 flex items-center gap-2">
                            {msg.senderId === currentUser?.uid ? `To: ${msg.recipientName}` : `From: ${msg.senderName}`}
                            {msg.isEdited && <span className="text-[10px] text-gray-400 font-normal italic">(edited)</span>}
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(msg.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {canEdit(msg) && (
                          <button
                            onClick={() => handleEdit(msg)}
                            className="opacity-0 group-hover:opacity-100 text-blue-500 hover:text-blue-700 text-sm font-medium px-3 py-1 bg-blue-50 rounded-md transition-all"
                          >
                            Edit
                          </button>
                        )}
                        {msg.senderId === currentUser?.uid && (
                          <button
                            onClick={() => handleDelete(msg.id)}
                            className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 p-1.5 bg-red-50 rounded-md transition-all"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="pl-13 ml-13 mt-2 text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {msg.text}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            // COMPOSE VIEW
            <div className="p-8 max-w-2xl mx-auto w-full">
              <h2 className="text-xl font-bold mb-6 text-gray-800">{editingId ? 'Edit Message' : 'New Message'}</h2>
              <form onSubmit={handleSend} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">Recipient</label>
                  <select
                    required
                    value={recipientId}
                    onChange={(e) => setRecipientId(e.target.value)}
                    disabled={!!editingId} // Cannot change recipient on edit
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none bg-white transition-all"
                  >
                    <option value="">Select User...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.displayName} ({u.email})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">Message</label>
                  <textarea
                    required
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    rows={8}
                    placeholder="Write your message..."
                    className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none resize-none transition-all"
                  />
                </div>
                <div className="flex items-center justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setView('inbox')}
                    className="px-6 py-2 text-gray-500 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-2 bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-lg font-bold hover:shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                  >
                    {editingId ? 'Update' : 'Send'} <Send size={16} />
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;