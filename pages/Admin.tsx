import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, Reorder } from 'framer-motion';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useEmotion } from '../context/EmotionContext';
import { db } from '../src/firebaseConfig';
import { ref, onValue, update, remove, set } from 'firebase/database';
import {
  Settings, Heart, Image as ImageIcon, Music,
  Film, MessageCircle, Lock, Eye, EyeOff, Plus, Trash2, PlayCircle, LogOut, Database, LogIn,
  MoveUp, MoveDown, Edit2, Check, X, ToggleRight, ToggleLeft, Folder, FolderPlus, FolderOpen, Users, Sparkles, Layout, Square, Activity
} from 'lucide-react';
import { TimelineEvent, Track, IntroStep, IntroStepType, ChatStep, ChatStepType, UserProfile } from '../types';
import { getOptimizedImageUrl } from '../utils';
import ChatFlowBuilder from '../components/ChatFlowBuilder';
import MuxUploader from '../components/MuxUploader';
import PermissionModal from '../components/PermissionModal';
import EmotionAdminTab from '../components/EmotionAdminTab';

type Tab = 'home' | 'intro' | 'journey' | 'gallery' | 'reels' | 'music' | 'message' | 'notes' | 'vault' | 'settings' | 'users' | 'layout' | 'emotion' | 'chat' | 'security';


const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('home');

  const {
    timelineData, setTimelineData,
    galleryImages, setGalleryImages,
    reelsData, setReelsData,
    musicTracks, setMusicTracks,
    notes, setNotes,
    vaultItems, setVaultItems,
    cardVisibility, setCardVisibility,
    birthdayMessage, setBirthdayMessage,
    vaultPin, setVaultPin,
    startupSettings, setStartupSettings,
    introFlow, setIntroFlow,
    chatSteps, setChatSteps,
    adminEmails, setAdminEmails,
    wishFolders, setWishFolders,
    siteTitle, setSiteTitle,
    welcomeMessage, setWelcomeMessage,
    homeCaption, setHomeCaption,
    appVersion, setAppVersion,
    maintenanceMode, setMaintenanceMode,
    maxMpinAttempts, setMaxMpinAttempts
  } = useData();

  const { isAdmin, loginWithGoogle, logout, currentUser, signupWithEmail, hasPermission } = useAuth();

  // Temporary State for Add Forms
  const [newTimeline, setNewTimeline] = useState<Partial<TimelineEvent>>({ year: '', title: '', description: '' });
  const [newImage, setNewImage] = useState('');
  const [newReel, setNewReel] = useState('');
  const [newTrack, setNewTrack] = useState<Partial<Track>>({ title: '', artist: '' });
  const [newAdminEmail, setNewAdminEmail] = useState('');

  // Intro Flow Edit State
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [newStep, setNewStep] = useState<Partial<IntroStep>>({ type: 'text', content: '' });

  // User Creation State
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  const [showUserPass, setShowUserPass] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'user' | 'admin'>('user');

  // Chat Flow Edit State
  const [newChatStep, setNewChatStep] = useState<Partial<ChatStep>>({
    type: 'text',
    question: '',
    expectedAnswer: '',
    successReply: '',
    failureReply: '',
    mediaUrl: '',
    linkUrl: '',
    linkText: '',
    options: [],
    inputRequired: true,
    matchType: 'contains',
    variable: ''
  });
  const [editingChatStepId, setEditingChatStepId] = useState<string | null>(null);
  const [isFlowView, setIsFlowView] = useState(true);
  const chatFormRef = useRef<HTMLDivElement>(null);

  // Update Feature States
  const [editingTimelineId, setEditingTimelineId] = useState<string | null>(null);
  const [editingGalleryId, setEditingGalleryId] = useState<string | null>(null);
  const [editingReelId, setEditingReelId] = useState<string | null>(null);
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);

  // Gallery Folder State
  const [selectedFolder, setSelectedFolder] = useState<string>('All');
  const [newFolderName, setNewFolderName] = useState('');

  // User Management State
  const [userList, setUserList] = useState<UserProfile[]>([]);
  const [permissionUser, setPermissionUser] = useState<UserProfile | null>(null);
  const [bannedIPs, setBannedIPs] = useState<any[]>([]);

  useEffect(() => {
    if (activeTab === 'users') {
      const usersRef = ref(db, 'users');
      // Listen for updates
      const unsub = onValue(usersRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const usersArray = Object.keys(data).map(key => ({ ...data[key], uid: key })); // Ensure UID is present
          setUserList(usersArray);
        } else {
          setUserList([]);
        }
      });

      const bansRef = ref(db, 'banned_ips');
      const unsubBans = onValue(bansRef, (snap) => {
        if (snap.exists()) {
          const data = snap.val();
          setBannedIPs(Object.keys(data).map(k => ({ id: k, ...data[k] })));
        } else { setBannedIPs([]); }
      });

      return () => { unsub(); unsubBans(); };
    }
  }, [activeTab]);

  const toggleUserRole = async (user: UserProfile) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    if (user.uid === currentUser?.uid) {
      if (!confirm("⚠️ You are about to remove your own Admin rights!\n\nYou will be logged out of this dashboard immediately. Continue?")) return;
    }
    await update(ref(db, `users/${user.uid}`), { role: newRole });
  };

  const toggleUserCardEdit = async (user: UserProfile) => {
    await update(ref(db, `users/${user.uid}`), { canEditCards: !user.canEditCards });
  };

  const deleteUserRecord = async (uid: string) => {
    if (!confirm("Allow this user access to be revoked? This deletes their profile record (but not their Auth account).")) return;
    await remove(ref(db, `users/${uid}`));
  };

  const removeBan = async (id: string) => {
    if (!confirm("Lift ban for this IP?")) return;
    await remove(ref(db, `banned_ips/${id}`));
  };

  // --- Handlers ---
  const toggleCard = (key: string) => {
    setCardVisibility({ ...cardVisibility, [key]: !cardVisibility[key] });
  };

  // ... (Other handlers unchanged) ...

  const addChatStep = () => {
    // Validation
    if (newChatStep.inputRequired !== false) {
      // If input required, we strictly need Question and Expected Answer
      if (!newChatStep.question || !newChatStep.expectedAnswer) {
        alert("For interactive steps, 'Bot Question' and 'Expected Answer' are required.");
        return;
      }
    } else {
      // If statement (no input), we at least need a Question OR some Media/Link content
      if (!newChatStep.question && !newChatStep.mediaUrl && !newChatStep.linkUrl) {
        alert("Please provide either text, an image/GIF, or a link.");
        return;
      }
    }

    if (editingChatStepId) {
      setChatSteps(chatSteps.map(s => s.id === editingChatStepId ? { ...s, ...newChatStep } as ChatStep : s));
      setEditingChatStepId(null);
    } else {
      const step: ChatStep = {
        id: Date.now().toString(),
        order: (chatSteps?.length || 0) + 1,
        type: newChatStep.type || 'text',
        question: newChatStep.question!,
        expectedAnswer: newChatStep.expectedAnswer!,
        successReply: newChatStep.successReply || 'Correct!',
        failureReply: newChatStep.failureReply || 'Incorrect.',
        mediaUrl: newChatStep.mediaUrl,
        linkUrl: newChatStep.linkUrl,
        linkText: newChatStep.linkText,
        options: newChatStep.options,
        inputRequired: newChatStep.inputRequired !== false, // Default true
        matchType: newChatStep.matchType || 'contains',
        variable: newChatStep.variable
      };
      setChatSteps([...(chatSteps || []), step]);
    }

    setNewChatStep({ type: 'text', question: '', expectedAnswer: '', successReply: '', failureReply: '', mediaUrl: '', linkUrl: '', linkText: '', options: [], inputRequired: true, matchType: 'contains', variable: '' });
  };

  const startEditChatStep = useCallback((step: ChatStep) => {
    setNewChatStep(step);
    setEditingChatStepId(step.id);
    // Scroll to form
    setTimeout(() => {
      chatFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }, []);

  const cancelEditChatStep = useCallback(() => {
    setNewChatStep({ type: 'text', question: '', expectedAnswer: '', successReply: '', failureReply: '', mediaUrl: '', linkUrl: '', linkText: '', options: [], inputRequired: true, matchType: 'contains', variable: '' });
    setEditingChatStepId(null);
  }, []);

  const handleDeleteStep = useCallback((id: string) => {
    setChatSteps(prev => (prev || []).filter(s => s.id !== id));
  }, [setChatSteps]);

  const moveChatStep = (index: number, direction: 'up' | 'down') => {
    if (!chatSteps) return;
    const newSteps = [...chatSteps];
    if (direction === 'up' && index > 0) {
      [newSteps[index], newSteps[index - 1]] = [newSteps[index - 1], newSteps[index]];
    } else if (direction === 'down' && index < newSteps.length - 1) {
      [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]];
    }
    // Update 'order' property for all steps
    const reordered = newSteps.map((step, i) => ({ ...step, order: i + 1 }));
    setChatSteps(reordered);
  };



  const addTimelineEvent = () => {
    if (!newTimeline.year || !newTimeline.title) return;

    if (editingTimelineId) {
      setTimelineData(timelineData.map(t => t.id === editingTimelineId ? { ...t, ...newTimeline } as TimelineEvent : t));
      setEditingTimelineId(null);
    } else {
      setTimelineData([...timelineData, {
        id: Date.now().toString(),
        year: newTimeline.year!,
        title: newTimeline.title!,
        description: newTimeline.description || '',
        side: timelineData.length % 2 === 0 ? 'left' : 'right',
        image: newTimeline.image || 'https://picsum.photos/400/300'
      }]);
    }
    setNewTimeline({ year: '', title: '', description: '' });
  };

  const startEditTimeline = (item: TimelineEvent) => {
    setNewTimeline(item);
    setEditingTimelineId(item.id);
  };

  const cancelEditTimeline = () => {
    setNewTimeline({ year: '', title: '', description: '' });
    setEditingTimelineId(null);
  };

  const deleteTimelineEvent = (id: string) => {
    setTimelineData(timelineData.filter(t => t.id !== id));
  };

  const addGalleryImage = () => {
    if (!newImage) return;

    if (newImage.includes('drive.google.com') && newImage.includes('/folders/')) {
      alert("⚠️ You pasted a Folder link!\n\nPlease open the specific image you want to add, click 'Get Link', and paste that instead.\n\nFolder links cannot be displayed as a single image.");
      return;
    }

    if (editingGalleryId) {
      setGalleryImages(galleryImages.map(g => g.id === editingGalleryId ? { ...g, url: newImage } : g));
      setEditingGalleryId(null);
    } else {
      setGalleryImages([...galleryImages, {
        id: Date.now().toString(),
        url: newImage,
        caption: 'New Memory',
        folder: selectedFolder !== 'All' ? selectedFolder : 'Unsorted'
      }]);
    }
    setNewImage('');
  };

  const startEditGallery = (item: any) => {
    setNewImage(item.url);
    setEditingGalleryId(item.id);
  };

  const deleteGalleryImage = (id: string) => {
    setGalleryImages(galleryImages.filter(g => g.id !== id));
  };

  const deleteFolder = (folderName: string) => {
    if (!confirm(`Are you sure you want to delete folder "${folderName}" and ALL its images?`)) return;
    setGalleryImages(galleryImages.filter(g => g.folder !== folderName));
    if (selectedFolder === folderName) setSelectedFolder('All');
  };

  const renameFolder = (oldName: string) => {
    const newName = prompt("Enter new folder name:", oldName);
    if (!newName || newName === oldName) return;
    setGalleryImages(galleryImages.map(img => img.folder === oldName ? { ...img, folder: newName } : img));
    if (selectedFolder === oldName) setSelectedFolder(newName);
  };


  const addReel = () => {
    if (!newReel) return;

    if (editingReelId) {
      setReelsData(reelsData.map(r => r.id === editingReelId ? { ...r, videoUrl: newReel, thumbnail: newReel } : r));
      setEditingReelId(null);
    } else {
      setReelsData([...reelsData, {
        id: Date.now().toString(),
        videoUrl: newReel,
        thumbnail: newReel,
        caption: 'New Reel',
        likes: 0
      }]);
    }
    setNewReel('');
  };

  const startEditReel = (item: any) => {
    setNewReel(item.videoUrl);
    setEditingReelId(item.id);
  };

  const deleteReel = (id: string) => {
    setReelsData(reelsData.filter(r => r.id !== id));
  };

  const addTrack = () => {
    if (!newTrack.title) return;

    if (editingTrackId) {
      setMusicTracks(musicTracks.map(t => t.id === editingTrackId ? { ...t, ...newTrack } as Track : t));
      setEditingTrackId(null);
    } else {
      setMusicTracks([...musicTracks, {
        id: Date.now().toString(),
        title: newTrack.title!,
        artist: newTrack.artist || 'Unknown',
        duration: '3:00',
        cover: 'https://picsum.photos/100/100'
      }]);
    }
    setNewTrack({ title: '', artist: '' });
  };

  const startEditTrack = (item: Track) => {
    setNewTrack(item);
    setEditingTrackId(item.id);
  };

  const deleteTrack = (id: string) => {
    setMusicTracks(musicTracks.filter(t => t.id !== id));
  };

  // --- Intro Flow Handlers ---

  const addIntroStep = () => {
    // Default valid step
    const step: IntroStep = {
      id: Date.now().toString(),
      type: newStep.type || 'text',
      title: newStep.title || '',
      content: newStep.content || '',
      buttonText: newStep.buttonText || 'Next',
      mediaUrl: newStep.mediaUrl || '',
      options: newStep.options || [],
      correctAnswer: newStep.correctAnswer || ''
    };

    // Basic validation for Quiz
    if (step.type === 'quiz' && (!step.options || step.options.length < 2)) {
      alert("Quiz must have at least 2 options.");
      return;
    }

    if (editingStepId) {
      updateIntroStep(editingStepId, step);
      setEditingStepId(null);
    } else {
      setIntroFlow([...(introFlow || []), step]);
    }
    setNewStep({ type: 'text', content: '' }); // Reset form
  };

  const startEditIntroStep = (step: IntroStep) => {
    setNewStep(step);
    setEditingStepId(step.id);
  };

  const cancelEditIntroStep = () => {
    setNewStep({ type: 'text', content: '' });
    setEditingStepId(null);
  };

  const deleteIntroStep = (id: string) => {
    setIntroFlow(introFlow.filter(s => s.id !== id));
  };

  const moveIntroStep = (index: number, direction: 'up' | 'down') => {
    if (!introFlow) return;
    const newFlow = [...introFlow];
    if (direction === 'up' && index > 0) {
      [newFlow[index], newFlow[index - 1]] = [newFlow[index - 1], newFlow[index]];
    } else if (direction === 'down' && index < newFlow.length - 1) {
      [newFlow[index], newFlow[index + 1]] = [newFlow[index + 1], newFlow[index]];
    }
    setIntroFlow(newFlow);
  };

  const updateIntroStep = (id: string, updated: Partial<IntroStep>) => {
    if (!introFlow) return;
    setIntroFlow(introFlow.map(s => s.id === id ? { ...s, ...updated } : s));
  };


  const canAccessAdmin = isAdmin || hasPermission('canViewAdmin');

  if (!canAccessAdmin) {
    return (
      <div className="h-screen flex items-center justify-center p-4 bg-gray-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 max-w-sm w-full"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gray-800 text-white rounded-full flex items-center justify-center mx-auto mb-4">
              <Settings size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Admin Access</h2>
            <p className="text-sm text-gray-500 mb-4">Sign in with an authorized Google account.</p>

            {currentUser && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
                Account <b>{currentUser.email}</b> is not authorized to access this panel.
              </div>
            )}

            {currentUser ? (
              <button onClick={() => logout()} className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 flex items-center justify-center gap-2">
                <LogOut size={18} /> Sign Out
              </button>
            ) : (
              <button onClick={() => loginWithGoogle()} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center gap-2">
                <LogIn size={18} /> Sign in with Google
              </button>
            )}

          </div>
        </motion.div>
      </div>
    );
  }

  const TabButton: React.FC<{ id: Tab, icon: any, label: string }> = ({ id, icon: Icon, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all ${activeTab === id ? 'bg-gray-800 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
    >
      <Icon size={18} />
      <span className="font-medium text-sm hidden md:inline">{label}</span>
    </button>
  );

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Settings className="text-gray-800" />
          <h1 className="font-bold text-xl text-gray-800">Admin Dashboard</h1>
        </div>
        <div className="flex gap-4 items-center">
          <a href="/#/home" target="_blank" className="flex items-center gap-1 text-sm bg-rose-50 text-rose-600 px-3 py-1.5 rounded-lg border border-rose-100 hover:bg-rose-100 font-medium transition-colors">
            <p>Test Preview</p>
          </a>

          <button
            onClick={() => {
              if (confirm("Are you sure you want to logout?")) {
                logout();
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-red-600/90 text-white rounded-lg shadow-md hover:bg-red-700 transition-all font-bold animate-pulse hover:animate-none ring-2 ring-red-400 ring-offset-2"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </header>



      <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
        {/* Sidebar */}
        <aside className="bg-white border-r border-gray-200 w-full md:w-64 flex-shrink-0 overflow-x-auto md:overflow-y-auto">
          <nav className="p-4 flex md:flex-col gap-2 min-w-max">
            <TabButton id="home" icon={Eye} label="Home Cards" />

            {isAdmin && (
              <>
                <TabButton id="users" icon={Users} label="User Management" />
                <TabButton id="emotion" icon={Activity} label="Emotion Settings" />
                <TabButton id="layout" icon={Layout} label="Home Layout" />
                <TabButton id="settings" icon={PlayCircle} label="Startup Settings" />
                <TabButton id="intro" icon={Sparkles} label="Intro Flow" />
                <TabButton id="chat" icon={MessageCircle} label="Chat Flow" />
                <TabButton id="security" icon={Lock} label="Security" />
              </>
            )}

            <TabButton id="journey" icon={Heart} label="Journey" />
            <TabButton id="gallery" icon={ImageIcon} label="Gallery" />
            <TabButton id="reels" icon={Film} label="Reels" />
            <TabButton id="music" icon={Music} label="Music" />
            <TabButton id="message" icon={MessageCircle} label="Message" />
            <TabButton id="notes" icon={MessageCircle} label="Notes" />
            <TabButton id="vault" icon={Lock} label="Vault" />

            <div className="border-l md:border-l-0 md:border-t md:mt-auto md:pt-2 pl-2 md:pl-0">
              <button
                onClick={() => {
                  if (confirm("Are you sure you want to logout?")) {
                    logout();
                  }
                }}
                className="flex items-center gap-2 px-4 py-3 rounded-xl transition-all bg-red-50 text-red-600 hover:bg-red-100 font-bold whitespace-nowrap animate-pulse hover:animate-none"
              >
                <LogOut size={18} />
                <span className="font-medium text-sm hidden md:inline">Logout</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-y-auto">


          {/* HOME LAYOUT TAB */}
          {activeTab === 'layout' && (
            <HomeLayoutEditor />
          )}

          {/* EMOTION SETTINGS TAB */}
          {activeTab === 'emotion' && (
            <EmotionAdminTab />
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b">
                  <div className="bg-rose-100 p-2 rounded-lg text-rose-600"><Lock size={24} /></div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Security Settings</h2>
                    <p className="text-sm text-gray-500">Manage access control and protection.</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Max Login Attempts (MPIN)</label>
                    <p className="text-xs text-gray-500 mb-2">Number of failed pin entries before the device is automatically banned.</p>
                    <div className="flex items-center gap-4">
                      <input
                        type="number"
                        min={3}
                        max={50}
                        className="w-24 p-2 border rounded-lg font-bold text-center"
                        value={maxMpinAttempts}
                        onChange={(e) => setMaxMpinAttempts(Number(e.target.value))}
                      />
                      <span className="text-sm text-gray-400">Default: 5</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CHAT FLOW TAB */}
          {activeTab === 'chat' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Chat Verification Flow</h2>
                  <p className="text-gray-500 text-sm">Design the interactive chat questions and answers for user verification.</p>
                </div>
                <button
                  onClick={() => setIsFlowView(!isFlowView)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-colors ${isFlowView ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
                >
                  {isFlowView ? <Database size={18} /> : <MessageCircle size={18} />}
                  {isFlowView ? 'List View' : 'Logic Flow'}
                </button>
              </div>

              {/* FLOW EDITOR */}
              {isFlowView ? (
                <ChatFlowBuilder
                  steps={chatSteps || []}
                  onUpdate={setChatSteps}
                  onEditStep={startEditChatStep}
                  onDeleteStep={handleDeleteStep}
                />
              ) : (
                /* Chat Steps List (Legacy) */
                <div className="space-y-4">
                  {chatSteps.map((step, index) => (
                    <div key={step.id} className="bg-white p-6 rounded-xl border flex gap-4 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-gray-100 p-2 rounded-bl-xl text-xs font-bold text-gray-500">Step {index + 1}</div>

                      <div className="flex flex-col items-center justify-center gap-1 mr-2 border-r pr-3">
                        <button disabled={index === 0} onClick={() => moveChatStep(index, 'up')} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"><MoveUp size={16} /></button>
                        <span className="text-xs font-mono font-bold text-gray-400">{index + 1}</span>
                        <button disabled={index === (chatSteps.length - 1)} onClick={() => moveChatStep(index, 'down')} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"><MoveDown size={16} /></button>
                      </div>

                      <div className="flex-1 flex gap-4 items-start">
                        <div className="bg-rose-100 p-3 rounded-full text-rose-600 mt-1 flex-shrink-0">
                          <MessageCircle size={24} />
                        </div>
                        <div className="flex-1 space-y-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <label className="text-xs font-bold text-gray-500 uppercase">Question (Bot) - <span className="text-rose-500">{step.type || 'text'}</span></label>
                              {step.inputRequired === false && <span className="bg-gray-200 text-gray-700 text-[10px] px-2 py-0.5 rounded-full font-bold">Statement (No Reply)</span>}
                            </div>
                            <p className="font-medium text-gray-900 border-l-4 border-rose-400 pl-3">{step.question}</p>

                            {(step.type === 'image' || step.type === 'gif') && step.mediaUrl && (
                              <div className="mt-2">
                                <img src={step.mediaUrl} alt="Step Media" className={`h-20 rounded border ${step.type === 'gif' ? 'object-contain' : 'object-cover'}`} />
                              </div>
                            )}
                            {step.type === 'link' && (
                              <div className="mt-2 text-sm text-blue-600">
                                Link: {step.linkText} ({step.linkUrl})
                              </div>
                            )}
                            {step.type === 'options' && step.options && (
                              <div className="mt-2 flex gap-2 flex-wrap">
                                {step.options.map(opt => (
                                  <span key={opt} className="px-2 py-1 bg-gray-100 rounded text-xs border">{opt}</span>
                                ))}
                              </div>
                            )}
                          </div>

                          {step.inputRequired !== false && (
                            <>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="text-xs font-bold text-gray-500 uppercase">Expected Answer</label>
                                  <div className="flex items-center gap-2">
                                    <p className="font-mono text-sm bg-gray-50 p-2 rounded border border-green-200 text-green-700">{step.expectedAnswer}</p>
                                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${step.matchType === 'exact' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                      {step.matchType === 'exact' ? 'Exact Match' : 'Contains'}
                                    </span>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-xs font-bold text-gray-500 uppercase">Success Reply</label>
                                  <p className="text-sm text-gray-700 italic">"{step.successReply}"</p>
                                </div>
                              </div>

                              <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Failure Reply</label>
                                <p className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-100">"{step.failureReply}"</p>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => startEditChatStep(step)}
                            className="p-2 text-blue-500 hover:bg-blue-50 rounded"
                          >
                            <Edit2 size={20} />
                          </button>
                          <button
                            onClick={() => setChatSteps(chatSteps.filter(s => s.id !== step.id))}
                            className="p-2 text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add / Edit Chat Step Form */}
              <div ref={chatFormRef} className={`p-6 rounded-xl border-2 border-dashed ${editingChatStepId ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-300'}`}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-700">{editingChatStepId ? 'Edit Chat Interaction' : 'Add Chat Interaction'}</h3>
                  {editingChatStepId && (
                    <button onClick={cancelEditChatStep} className="text-sm text-red-500 font-bold hover:underline">Cancel Edit</button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Step Type</label>
                    <select
                      className="w-full p-3 border rounded-lg mb-4"
                      value={newChatStep.type || 'text'}
                      onChange={e => {
                        const val = e.target.value as ChatStepType;
                        // Auto-set default input requirement (Text/Options = True, Media/Link = False)
                        const shouldRequire = val === 'text' || val === 'options';
                        setNewChatStep({ ...newChatStep, type: val, inputRequired: shouldRequire });
                      }}
                    >
                      <option value="text">Text Question</option>
                      <option value="image">Image Question</option>
                      <option value="gif">GIF / Sticker</option>
                      <option value="link">Link / Data</option>
                      <option value="options">Multiple Choice (Options)</option>
                      <option value="login">Authentication (Login)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Bot Question / Message</label>
                    <textarea
                      className="w-full p-3 border rounded-lg min-h-[100px]"
                      placeholder="e.g. What is my nickname?"
                      value={newChatStep.question}
                      onChange={e => setNewChatStep({ ...newChatStep, question: e.target.value })}
                    />
                  </div>

                  {(newChatStep.type === 'image' || newChatStep.type === 'gif') && (
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">{newChatStep.type === 'gif' ? 'GIF URL' : 'Image URL'}</label>
                      <input
                        className="w-full p-3 border rounded-lg"
                        placeholder={newChatStep.type === 'gif' ? "https://media.giphy.com/..." : "https://..."}
                        value={newChatStep.mediaUrl || ''}
                        onChange={e => setNewChatStep({ ...newChatStep, mediaUrl: e.target.value })}
                      />
                    </div>
                  )}

                  {newChatStep.type === 'link' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Link URL</label>
                        <input
                          className="w-full p-3 border rounded-lg"
                          placeholder="https://..."
                          value={newChatStep.linkUrl || ''}
                          onChange={e => setNewChatStep({ ...newChatStep, linkUrl: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Link Button Text</label>
                        <input
                          className="w-full p-3 border rounded-lg"
                          placeholder="View Document"
                          value={newChatStep.linkText || ''}
                          onChange={e => setNewChatStep({ ...newChatStep, linkText: e.target.value })}
                        />
                      </div>
                    </div>
                  )}

                  {newChatStep.type === 'options' && (
                    <div>
                      <label className="block text-xs font-bold text-purple-700 mb-1">Options (Comma Separated)</label>
                      <input
                        className="w-full p-3 border rounded-lg bg-purple-50 border-purple-200"
                        placeholder="Yes, No, Maybe"
                        value={newChatStep.options?.join(', ') || ''}
                        onChange={e => setNewChatStep({ ...newChatStep, options: e.target.value.split(',').map(s => s.trim()) })}
                      />
                    </div>
                  )}
                  {/* Google Login Toggle */}
                  <div className="mb-4 mt-4 bg-white p-3 rounded-lg border border-gray-200">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!newChatStep.showGoogleLogin}
                        onChange={e => setNewChatStep({ ...newChatStep, showGoogleLogin: e.target.checked })}
                        className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm font-bold text-gray-700">Show 'Sign in with Google' Button</span>
                    </label>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2 mt-4">
                      <label className="text-xs font-bold text-gray-500">Requires User Reply?</label>
                      <button
                        onClick={() => setNewChatStep({ ...newChatStep, inputRequired: !newChatStep.inputRequired })}
                        className={`relative w-10 h-5 rounded-full transition-colors ${newChatStep.inputRequired !== false ? 'bg-green-500' : 'bg-gray-300'}`}
                      >
                        <div className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform ${newChatStep.inputRequired !== false ? 'translate-x-5' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {newChatStep.inputRequired !== false && (
                    <>
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label className="block text-xs font-bold text-gray-500 mb-1">Expected Answer (Keyword) <span className="font-normal text-gray-400 lowercase">(comma separated for multiple)</span></label>
                          <input
                            className="w-full p-3 border rounded-lg font-mono text-sm"
                            placeholder="e.g. addi, aditya, adi"
                            value={newChatStep.expectedAnswer}
                            onChange={e => setNewChatStep({ ...newChatStep, expectedAnswer: e.target.value })}
                          />
                          <p className="text-[10px] text-gray-400 mt-1">Case-insensitive match.</p>
                        </div>
                        <div className="w-1/3">
                          <label className="block text-xs font-bold text-gray-500 mb-1">Match Logic</label>
                          <select
                            className="w-full p-3 border rounded-lg text-sm"
                            value={newChatStep.matchType || 'contains'}
                            onChange={e => setNewChatStep({ ...newChatStep, matchType: e.target.value as 'contains' | 'exact' })}
                          >
                            <option value="contains">Contains Keyword</option>
                            <option value="exact">Exact Match</option>
                          </select>
                        </div>
                      </div>

                      {/* Variable Input */}
                      <div>
                        <label className="block text-xs font-bold text-blue-500 mb-1">Store Answer as Variable (Optional)</label>
                        <input
                          className="w-full p-3 border rounded-lg bg-blue-50/50"
                          placeholder="e.g. user_name"
                          value={newChatStep.variable || ''}
                          onChange={e => setNewChatStep({ ...newChatStep, variable: e.target.value })}
                        />
                        <p className="text-[10px] text-gray-400 mt-1">If set, you can use <b>{`{${newChatStep.variable || 'variable_name'}}`}</b> in future steps to show this answer.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Success Reply</label>
                          <input
                            className="w-full p-3 border rounded-lg"
                            placeholder="Correct! Next question..."
                            value={newChatStep.successReply}
                            onChange={e => setNewChatStep({ ...newChatStep, successReply: e.target.value })}
                          />
                        </div>
                        {/* Dynamic Failure/Warning Input */}
                        {['BAN_DEVICE', 'WARNING_ONLY'].includes(newChatStep.failureNextStepId || '') ? (
                          <div>
                            <label className="block text-xs font-bold mb-1 text-red-600">Custom Warning Message</label>
                            <input
                              className="w-full p-3 border rounded-lg border-red-200 bg-red-50"
                              placeholder={newChatStep.failureNextStepId === 'BAN_DEVICE' ? "You have been banned..." : "Warning..."}
                              value={newChatStep.warningMessage || ''}
                              onChange={e => setNewChatStep({ ...newChatStep, warningMessage: e.target.value })}
                            />
                            <p className="text-[10px] text-gray-400 mt-1">This message will be shown specifically for this warning/ban event.</p>

                            {newChatStep.failureNextStepId === 'WARNING_ONLY' && (
                              <div className="mt-3">
                                <label className="block text-xs font-bold mb-1 text-red-600">Max Attempts Before Ban (Optional)</label>
                                <input
                                  type="number"
                                  min="1"
                                  className="w-full p-3 border rounded-lg border-red-200 bg-red-50"
                                  placeholder="Leave empty for unlimited retries"
                                  value={newChatStep.maxAttempts || ''}
                                  onChange={e => setNewChatStep({ ...newChatStep, maxAttempts: e.target.value ? parseInt(e.target.value) : undefined })}
                                />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Failure Reply</label>
                            <input
                              className="w-full p-3 border rounded-lg"
                              placeholder="Wrong! You said {input}..."
                              value={newChatStep.failureReply}
                              onChange={e => setNewChatStep({ ...newChatStep, failureReply: e.target.value })}
                            />
                            <p className="text-[10px] text-gray-400 mt-1">Use <b>{`{input}`}</b> to insert user's wrong answer.</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Flow Control Logic */}
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 mt-4">
                    <h4 className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2"><ToggleRight size={16} /> Flow Logic Control</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">On Success (Go To)</label>
                        <select
                          className="w-full p-2 border rounded text-sm"
                          value={newChatStep.nextStepId || ''}
                          onChange={e => setNewChatStep({ ...newChatStep, nextStepId: e.target.value })}
                        >
                          <option value="">Next Sequential Step (Default)</option>
                          {chatSteps?.map(s => (
                            s.id !== editingChatStepId && <option key={s.id} value={s.id}>Step {s.order}: {s.question?.substring(0, 20)}...</option>
                          ))}
                        </select>
                      </div>

                      {newChatStep.inputRequired !== false && (
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">On Failure (Go To)</label>
                          <select
                            className="w-full p-2 border rounded text-sm"
                            value={newChatStep.failureNextStepId || ''}
                            onChange={e => {
                              const val = e.target.value;
                              const update = { ...newChatStep, failureNextStepId: val };
                              if (val === 'BAN_DEVICE' && !newChatStep.warningMessage) {
                                update.warningMessage = "Verification Failed. Access Denied.";
                              }
                              if (val === 'WARNING_ONLY' && !newChatStep.warningMessage) {
                                update.warningMessage = "Warning: Incorrect Answer.";
                              }
                              setNewChatStep(update);
                            }}
                          >
                            <option value="">Repeat / None</option>
                            <option value="WARNING_ONLY">⚠️ Show Warning Message & Retry</option>
                            <option value="BAN_DEVICE">⛔ Access Denied & Ban Device</option>
                            {chatSteps?.map(s => (
                              s.id !== editingChatStepId && <option key={s.id} value={s.id}>Step {s.order}: {s.question?.substring(0, 20)}...</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Options Branching */}
                    {newChatStep.type === 'options' && newChatStep.options && newChatStep.options.length > 0 && (
                      <div className="mt-4 border-t border-amber-200 pt-3">
                        <label className="block text-xs font-bold text-gray-500 mb-2">Option Branching (Specific Routes)</label>
                        <div className="space-y-2">
                          {newChatStep.options.map((opt, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="text-xs font-medium bg-white px-2 py-1 border rounded min-w-[80px] text-center truncate">{opt}</span>
                              <span className="text-gray-400">→</span>
                              <select
                                className="flex-1 p-1.5 border rounded text-xs"
                                value={newChatStep.branches?.find(b => b.label === opt)?.nextStepId || ''}
                                onChange={e => {
                                  const currentBranches = newChatStep.branches || [];
                                  const newBranch = { label: opt, nextStepId: e.target.value };
                                  const otherBranches = currentBranches.filter(b => b.label !== opt);
                                  const updatedBranches = e.target.value ? [...otherBranches, newBranch] : otherBranches;
                                  setNewChatStep({ ...newChatStep, branches: updatedBranches });
                                }}
                              >
                                <option value="">Follow Success Path</option>
                                {chatSteps?.map(s => (
                                  s.id !== editingChatStepId && <option key={s.id} value={s.id}>Step {s.order}: {s.question?.substring(0, 20)}...</option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={addChatStep}
                  className={`w-full mt-4 text-white py-3 rounded-lg font-bold flex justify-center items-center gap-2 ${editingChatStepId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-800 hover:bg-gray-700'}`}
                >
                  {editingChatStepId ? <Edit2 size={18} /> : <Plus size={18} />} {editingChatStepId ? 'Update Interaction' : 'Add Chat Step'}
                </button>
              </div>

            </div>
          )}

          {/* INTRO FLOW TAB */}
          {activeTab === 'intro' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Intro Sequence Flow</h2>
              <p className="text-gray-500 text-sm">Define the steps user sees before the countdown.</p>

              {/* Steps List */}
              <div className="space-y-4">
                {introFlow && introFlow.map((step, index) => (
                  <div key={step.id} className="bg-white p-4 rounded-xl border flex flex-col md:flex-row gap-4 items-start md:items-center shadow-sm">
                    <div className="flex flex-col items-center justify-center gap-1 mr-2">
                      <button disabled={index === 0} onClick={() => moveIntroStep(index, 'up')} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"><MoveUp size={16} /></button>
                      <span className="text-xs font-mono font-bold text-gray-400">{index + 1}</span>
                      <button disabled={index === (introFlow.length - 1)} onClick={() => moveIntroStep(index, 'down')} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"><MoveDown size={16} /></button>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${step.type === 'quiz' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {step.type}
                        </span>
                        {step.title && <span className="font-bold text-gray-800">{step.title.substring(0, 30)}...</span>}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{step.content}</p>
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => startEditIntroStep(step)} className="p-2 text-blue-500 hover:bg-blue-50 rounded"><Edit2 size={18} /></button>
                      <button onClick={() => deleteIntroStep(step.id)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 size={18} /></button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add / Edit Step Form */}
              <div className={`p-6 rounded-xl border-2 border-dashed ${editingStepId ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-300'}`}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-700">{editingStepId ? 'Edit Step' : 'Add New Step'}</h3>
                  {editingStepId && (
                    <button onClick={cancelEditIntroStep} className="text-sm text-red-500 font-bold hover:underline">Cancel Edit</button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Type</label>
                    <select
                      className="w-full p-2 border rounded"
                      value={newStep.type}
                      onChange={e => setNewStep({ ...newStep, type: e.target.value as IntroStepType })}
                    >
                      <option value="text">Text / Message</option>
                      <option value="greeting">Greeting Card</option>
                      <option value="meme">Meme / Visual</option>
                      <option value="image">Image</option>
                      <option value="video">Video (Mux/URL)</option>
                      <option value="audio">Audio / Voice Note</option>
                      <option value="quiz">Quiz Question</option>
                      <option value="chat">Chat Verification</option>
                    </select>
                  </div>
                  {newStep.type !== 'chat' && (
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Button Text</label>
                      <input className="w-full p-2 border rounded" placeholder="Next" value={newStep.buttonText || ''} onChange={e => setNewStep({ ...newStep, buttonText: e.target.value })} />
                    </div>
                  )}

                  {newStep.type !== 'chat' && (
                    <div className="col-span-full">
                      <label className="block text-xs font-bold text-gray-500 mb-1">Title (Optional)</label>
                      <input className="w-full p-2 border rounded" placeholder="Big Heading" value={newStep.title || ''} onChange={e => setNewStep({ ...newStep, title: e.target.value })} />
                    </div>
                  )}

                  {newStep.type !== 'chat' && (
                    <div className="col-span-full">
                      <label className="block text-xs font-bold text-gray-500 mb-1">Content / Question</label>
                      <textarea className="w-full p-2 border rounded" rows={3} placeholder="The main text body or question..." value={newStep.content || ''} onChange={e => setNewStep({ ...newStep, content: e.target.value })} />
                    </div>
                  )}

                  {(newStep.type === 'meme' || newStep.type === 'image' || newStep.type === 'video' || newStep.type === 'audio') && (
                    <div className="col-span-full">
                      <label className="block text-xs font-bold text-gray-500 mb-1">
                        {newStep.type === 'video' ? 'Video URL (Mux Playback ID or URL)' :
                          newStep.type === 'audio' ? 'Audio URL (Google Drive or Direct Link)' :
                            'Image / PDF URL'}
                      </label>
                      <input className="w-full p-2 border rounded" placeholder="https://..." value={newStep.mediaUrl || ''} onChange={e => setNewStep({ ...newStep, mediaUrl: e.target.value })} />
                      {newStep.type === 'video' && (
                        <p className="text-xs text-gray-400 mt-1">Enter Mux Playback ID (e.g., abc123xyz) or full video URL</p>
                      )}
                      {newStep.type === 'audio' && (
                        <p className="text-xs text-gray-400 mt-1">Google Drive link or direct audio file URL</p>
                      )}
                    </div>
                  )}

                  {newStep.type === 'quiz' && (
                    <div className="col-span-full bg-purple-50 p-4 rounded-lg border border-purple-100">
                      <label className="block text-xs font-bold text-purple-700 mb-2">Quiz Options (Comma separated)</label>
                      <input
                        className="w-full p-2 border rounded mb-2"
                        placeholder="Option A, Option B, Option C..."
                        value={newStep.options?.join(', ') || ''}
                        onChange={e => setNewStep({ ...newStep, options: e.target.value.split(',').map(s => s.trim()) })}
                      />
                      <label className="block text-xs font-bold text-purple-700 mb-2">Correct Answer</label>
                      <input
                        className="w-full p-2 border rounded"
                        placeholder="Must match one option exactly"
                        value={newStep.correctAnswer || ''}
                        onChange={e => setNewStep({ ...newStep, correctAnswer: e.target.value })}
                      />
                    </div>
                  )}

                  {newStep.type === 'chat' && (
                    <div className="col-span-full bg-blue-50 p-4 rounded text-blue-800 text-sm">
                      This step will insert the <b>Chat Verification Flow</b>.
                      Configure the questions in the <b>Chat Flow</b> tab.
                    </div>
                  )}

                </div>
                <button onClick={addIntroStep} className={`w-full text-white py-3 rounded-lg font-bold flex justify-center items-center gap-2 ${editingStepId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-800 hover:bg-gray-700'}`}>
                  {editingStepId ? <Edit2 size={18} /> : <Plus size={18} />} {editingStepId ? 'Update Step' : 'Add Step to Flow'}
                </button>
              </div>

            </div>
          )}


          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Startup Configuration</h2>

              {/* General Identity */}
              <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
                <h3 className="font-bold text-gray-700">General Identity</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">App Name / Site Title</label>
                    <input
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-rose-500 outline-none"
                      value={siteTitle}
                      onChange={e => setSiteTitle(e.target.value)}
                      placeholder="e.g. My App"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">App Version</label>
                    <input
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-rose-500 outline-none"
                      value={appVersion}
                      onChange={e => setAppVersion(e.target.value)}
                      placeholder="e.g. 1.0.0"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">

                {/* Mode Selection */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">Initial Loading Page Mode</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => setStartupSettings({ ...startupSettings, mode: 'full' })}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${startupSettings.mode === 'full' ? 'border-rose-500 bg-rose-50 ring-2 ring-rose-200' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <div className="font-bold text-gray-800 mb-1">💖 Full Intro</div>
                      <p className="text-xs text-gray-500">Show the custom Flow, then Countdown.</p>
                    </button>

                    <button
                      onClick={() => setStartupSettings({ ...startupSettings, mode: 'countdown' })}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${startupSettings.mode === 'countdown' ? 'border-rose-500 bg-rose-50 ring-2 ring-rose-200' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <div className="font-bold text-gray-800 mb-1">⏱️ Countdown Only</div>
                      <p className="text-xs text-gray-500">Skip Flow. Show Button and Countdown.</p>
                    </button>

                    <button
                      onClick={() => setStartupSettings({ ...startupSettings, mode: 'direct_home' })}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${startupSettings.mode === 'direct_home' ? 'border-rose-500 bg-rose-50 ring-2 ring-rose-200' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <div className="font-bold text-gray-800 mb-1">🏠 Direct Home</div>
                      <p className="text-xs text-gray-500">Skip all animations. Go straight to Home Dashboard.</p>
                    </button>
                  </div>
                </div>

                {/* Show Once Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div>
                    <h4 className="font-bold text-gray-800">Show Intro Only Once</h4>
                    <p className="text-xs text-gray-500">If enabled, visitors will skip the intro after seeing it once.</p>
                  </div>
                  <button
                    onClick={() => setStartupSettings({ ...startupSettings, showOnce: !startupSettings.showOnce })}
                    className={`text-2xl transition-colors ${startupSettings.showOnce ? 'text-green-500' : 'text-gray-300'}`}
                  >
                    {startupSettings.showOnce ? <ToggleRight size={40} /> : <ToggleLeft size={40} />}
                  </button>
                </div>

                {/* Reset Seen Status */}
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Intro Status: <span className="font-bold">{startupSettings.hasSeen ? 'Global Seen' : 'Global Unseen'}</span> (Local: {localStorage.getItem('intro_seen') ? 'Seen' : 'Unseen'})
                    </span>
                    <button
                      onClick={() => {
                        localStorage.removeItem('intro_seen');
                        setStartupSettings({ ...startupSettings, hasSeen: false });
                        alert('Intro status reset! You can now see the intro again.');
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-300"
                    >
                      Reset "Seen" Status
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Clears both global (DB) and local (this browser) seen history. Refresh if status doesn't update immediately.</p>
                </div>

                {/* Maintenance Mode Section */}
                <div className="border-t pt-6">
                  <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <Settings size={20} className="text-orange-500" />
                    Maintenance Mode
                  </h3>
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4">
                    <p className="text-sm text-orange-800 mb-2">
                      <strong>⚠️ When enabled:</strong> Only admins can access the app. All other users will see a maintenance page.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Enable/Disable Toggle */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <label className="font-bold text-gray-700">Enable Maintenance Mode</label>
                        <p className="text-xs text-gray-500 mt-1">Block non-admin access to the app</p>
                      </div>
                      <button
                        onClick={() => setMaintenanceMode({ ...maintenanceMode, enabled: !maintenanceMode.enabled })}
                        className={`relative w-14 h-7 rounded-full transition-colors ${maintenanceMode.enabled ? 'bg-orange-500' : 'bg-gray-300'}`}
                      >
                        <div className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full transition-transform ${maintenanceMode.enabled ? 'translate-x-7' : ''}`} />
                      </button>
                    </div>

                    {/* Custom Message */}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Maintenance Message</label>
                      <textarea
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                        rows={3}
                        value={maintenanceMode.message}
                        onChange={e => setMaintenanceMode({ ...maintenanceMode, message: e.target.value })}
                        placeholder="We are currently performing maintenance..."
                      />
                    </div>

                    {/* Image URL */}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Image URL (Optional)</label>
                      <input
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        value={maintenanceMode.imageUrl || ''}
                        onChange={e => setMaintenanceMode({ ...maintenanceMode, imageUrl: e.target.value })}
                        placeholder="https://..."
                      />
                      {maintenanceMode.imageUrl && (
                        <div className="mt-2">
                          <img src={maintenanceMode.imageUrl} alt="Preview" className="max-w-xs rounded-lg border" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Manage Admins - New Section */}
                <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
                  <h3 className="font-bold text-gray-700">Manage Administrators</h3>
                  <div className="flex gap-4">
                    <input
                      className="flex-1 p-2 border rounded"
                      placeholder="new.admin@example.com"
                      value={newAdminEmail}
                      onChange={e => setNewAdminEmail(e.target.value)}
                    />
                    <button
                      onClick={() => {
                        if (newAdminEmail && !adminEmails?.includes(newAdminEmail)) {
                          setAdminEmails([...(adminEmails || []), newAdminEmail]);
                          setNewAdminEmail('');
                        }
                      }}
                      className="bg-gray-800 text-white px-4 py-2 rounded font-bold text-sm"
                    >
                      Add Admin
                    </button>
                  </div>
                  <div className="space-y-2">
                    {adminEmails?.map(email => (
                      <div key={email} className="flex justify-between items-center p-2 bg-gray-50 rounded border">
                        <span className="text-gray-700 font-mono text-sm">{email}</span>
                        <button
                          onClick={() => setAdminEmails(adminEmails.filter(e => e !== email))}
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>



              </div>
            </div>
          )}

          {/* USERS TAB */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">User Management</h2>
              <p className="text-gray-500">Manage user roles and permissions.</p>

              {/* Create New User Section */}
              <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
                <h3 className="font-bold text-gray-700">Create New User Account</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    className="p-2 border rounded"
                    placeholder="Email"
                    value={newUserEmail}
                    onChange={e => setNewUserEmail(e.target.value)}
                  />
                  <div className="relative">
                    <input
                      className="p-2 border rounded w-full pr-10"
                      placeholder="Password"
                      type={showUserPass ? "text" : "password"}
                      value={newUserPass}
                      onChange={e => setNewUserPass(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowUserPass(!showUserPass)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showUserPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      className="p-2 border rounded flex-1"
                      placeholder="Display Name"
                      value={newUserName}
                      onChange={e => setNewUserName(e.target.value)}
                    />
                    <select
                      className="p-2 border rounded bg-gray-50"
                      value={newUserRole}
                      onChange={e => setNewUserRole(e.target.value as 'user' | 'admin')}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    if (newUserEmail && newUserPass) {
                      try {
                        await signupWithEmail(newUserEmail, newUserPass, newUserName, newUserRole, true);
                        alert("User created successfully!");
                        setNewUserEmail('');
                        setNewUserPass('');
                        setNewUserName('');
                        setNewUserRole('user');
                      } catch (err: any) {
                        alert("Error creating user: " + err.message);
                      }
                    } else {
                      alert("Please fill in email and password.");
                    }
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded font-bold text-sm w-full md:w-auto"
                >
                  Create User
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase">User</th>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase">Role</th>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase">Access Control</th>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {userList.map(user => (
                      <tr key={user.uid} className="hover:bg-gray-50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {user.photoURL ? (
                              <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full" />
                            ) : (
                              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                                <Users size={20} />
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-gray-800">{user.displayName || 'Unnamed User'}</div>
                              <div className="text-xs text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <button onClick={() => toggleUserRole(user)} className={`px-3 py-1 rounded-full text-xs font-bold border ${user.role === 'admin' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                            {user.role === 'admin' ? 'Admin' : 'User'}
                          </button>
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => setPermissionUser(user)}
                            className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors"
                          >
                            <Lock size={14} /> Manage Access & Roles
                          </button>
                          <div className="mt-1 flex gap-1 flex-wrap">
                            {user.customPermissions?.canViewAdmin && <span className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-[10px] font-bold">Admin Panel</span>}
                            {user.customPermissions?.canEditGallery && <span className="px-1.5 py-0.5 bg-green-100 text-green-600 rounded text-[10px] font-bold">Gallery</span>}
                            {/* Show a few key ones */}
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <button onClick={() => deleteUserRecord(user.uid)} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded">
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {userList.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-gray-400">
                          No users found. (Users must log in once to appear here)
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {permissionUser && (
                <PermissionModal
                  user={permissionUser}
                  isOpen={true}
                  onClose={() => setPermissionUser(null)}
                  onUpdate={async (uid, permissions) => {
                    await update(ref(db, `users/${uid}`), { customPermissions: permissions });
                  }}
                />
              )}

              <div className="mt-12">
                <h3 className="text-xl font-bold text-red-700 mb-4 flex items-center gap-2"><Lock size={20} /> Banned Devices / IPs</h3>
                <div className="bg-white rounded-xl shadow-sm border border-red-100 overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-red-50 border-b border-red-100">
                      <tr>
                        <th className="p-4 text-xs font-bold text-red-800 uppercase">IP Address</th>
                        <th className="p-4 text-xs font-bold text-red-800 uppercase">Reason</th>
                        <th className="p-4 text-xs font-bold text-red-800 uppercase">Banned At</th>
                        <th className="p-4 text-xs font-bold text-red-800 uppercase text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-red-50">
                      {bannedIPs.map(ban => (
                        <tr key={ban.id} className="hover:bg-red-50/50">
                          <td className="p-4 font-mono text-sm text-gray-700">{ban.ip}</td>
                          <td className="p-4 text-sm text-red-600">{ban.reason}</td>
                          <td className="p-4 text-xs text-gray-500">{new Date(ban.bannedAt || Date.now()).toLocaleDateString()}</td>
                          <td className="p-4 text-right">
                            <button onClick={() => removeBan(ban.id)} className="text-gray-500 hover:text-green-600 p-2 hover:bg-green-50 rounded" title="Lift Ban">
                              <Check size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {bannedIPs.length === 0 && (
                        <tr><td colSpan={4} className="p-8 text-center text-gray-400">No banned IPs found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* HOME TAB */}
          {activeTab === 'home' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Manage Home Page</h2>

              {/* Site Title Editor */}
              <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
                <h3 className="font-bold text-gray-700">Site Browser Title</h3>
                <div className="flex gap-4">
                  <input
                    className="flex-1 p-2 border rounded"
                    placeholder="Happy Birthday My Besti"
                    defaultValue={siteTitle}
                    onBlur={(e) => setSiteTitle(e.target.value)}
                  />
                  <button className="bg-gray-100 text-gray-600 px-4 py-2 rounded font-bold text-sm pointer-events-none">
                    Auto-Saved
                  </button>
                </div>
                <p className="text-xs text-gray-400">The title shown in the browser tab and search results.</p>
              </div>

              {/* Welcome Message Editor */}
              <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
                <h3 className="font-bold text-gray-700">Welcome Title</h3>
                <div className="flex gap-4">
                  <input
                    className="flex-1 p-2 border rounded"
                    placeholder="Welcome, My Besti"
                    defaultValue={welcomeMessage}
                    onBlur={(e) => setWelcomeMessage(e.target.value)}
                  />
                  <button className="bg-gray-100 text-gray-600 px-4 py-2 rounded font-bold text-sm pointer-events-none">
                    Auto-Saved
                  </button>
                </div>
                <p className="text-xs text-gray-400">Click outside the box to save changes.</p>
              </div>

              {/* Home Caption Editor */}
              <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
                <h3 className="font-bold text-gray-700">Home Caption</h3>
                <div className="flex gap-4">
                  <textarea
                    className="flex-1 p-2 border rounded min-h-[80px]"
                    placeholder="Every love story is beautiful, but ours is my favorite."
                    defaultValue={homeCaption}
                    onBlur={(e) => setHomeCaption(e.target.value)}
                  />
                  <button className="bg-gray-100 text-gray-600 px-4 py-2 rounded font-bold text-sm pointer-events-none h-fit">
                    Auto-Saved
                  </button>
                </div>
                <p className="text-xs text-gray-400">The caption that appears below the welcome message on the home page.</p>
              </div>

              <h2 className="text-xl font-bold mt-8">Card Visibility</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.keys(cardVisibility).map(key => (
                  <div key={key} className="bg-white p-4 rounded-xl border flex justify-between items-center shadow-sm">
                    <span className="font-mono text-gray-600">{key}</span>
                    <button
                      onClick={() => toggleCard(key)}
                      className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${cardVisibility[key] ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                    >
                      {cardVisibility[key] ? <Eye size={16} /> : <EyeOff size={16} />}
                      {cardVisibility[key] ? 'Visible' : 'Hidden'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* JOURNEY TAB */}
          {activeTab === 'journey' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Timeline Events</h2>

              <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
                <h3 className="font-semibold text-gray-700">Add New Event</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input placeholder="Year (e.g. 2025)" className="p-2 border rounded" value={newTimeline.year} onChange={e => setNewTimeline({ ...newTimeline, year: e.target.value })} />
                  <input placeholder="Title" className="p-2 border rounded" value={newTimeline.title} onChange={e => setNewTimeline({ ...newTimeline, title: e.target.value })} />
                  <input placeholder="Image URL (Optional)" className="p-2 border rounded" value={newTimeline.image} onChange={e => setNewTimeline({ ...newTimeline, image: e.target.value })} />
                  <textarea placeholder="Description" className="p-2 border rounded col-span-full" rows={2} value={newTimeline.description} onChange={e => setNewTimeline({ ...newTimeline, description: e.target.value })} />
                </div>
                <div className="flex gap-2">
                  <button onClick={addTimelineEvent} className="bg-gray-800 text-white px-4 py-2 rounded flex items-center gap-2 text-sm hover:bg-gray-700">
                    {editingTimelineId ? <Edit2 size={16} /> : <Plus size={16} />}
                    {editingTimelineId ? 'Update Event' : 'Add Event'}
                  </button>
                  {editingTimelineId && (
                    <button onClick={cancelEditTimeline} className="bg-white border text-gray-700 px-4 py-2 rounded flex items-center gap-2 text-sm hover:bg-gray-100">
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {timelineData.map(item => (
                  <div key={item.id} className="bg-white p-4 rounded-xl border flex justify-between items-center">
                    <div>
                      <span className="font-bold text-rose-500">{item.year}</span> - <span className="font-semibold">{item.title}</span>
                      <p className="text-xs text-gray-500 truncate max-w-md">{item.description}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => startEditTimeline(item)} className="text-blue-400 hover:text-blue-600 p-2"><Edit2 size={18} /></button>
                      <button onClick={() => deleteTimelineEvent(item.id)} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={18} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}



          {/* GALLERY TAB */}
          {
            activeTab === 'gallery' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Gallery Images</h2>

                <div className="flex flex-col md:flex-row gap-6">
                  {/* FOLDER SIDEBAR */}
                  <div className="w-full md:w-64 flex-shrink-0 space-y-4">
                    <div className="bg-white p-4 rounded-xl border shadow-sm">
                      <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <FolderOpen size={18} /> Folders
                      </h3>

                      {/* Add Folder Input */}
                      <div className="flex gap-2 mb-4">
                        <input
                          className="w-full text-xs p-2 border rounded"
                          placeholder="New Folder..."
                          value={newFolderName}
                          onChange={e => setNewFolderName(e.target.value)}
                        />
                        <button
                          onClick={() => {
                            if (newFolderName) {
                              setSelectedFolder(newFolderName);
                              setNewFolderName('');
                            }
                          }}
                          className="bg-gray-800 text-white p-2 rounded"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <div className="space-y-1">
                        <button
                          onClick={() => setSelectedFolder('All')}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex justify-between items-center ${selectedFolder === 'All' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                          <span>All Photos</span>
                          <span className="bg-gray-200 text-gray-600 text-xs px-1.5 rounded-full">{galleryImages.length}</span>
                        </button>

                        {/* Dynamic Folders */}
                        {[...new Set(galleryImages.map(img => img.folder || 'Unsorted'))].sort().map(folder => (
                          <button
                            key={folder}
                            onClick={() => setSelectedFolder(folder)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex justify-between items-center ${selectedFolder === folder ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <Folder size={14} />
                              <span className="truncate max-w-[100px]">{folder}</span>
                            </div>
                            <span className="bg-gray-200 text-gray-600 text-xs px-1.5 rounded-full">{galleryImages.filter(i => (i.folder || 'Unsorted') === folder).length}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* MAIN CONTENT */}
                  <div className="flex-1 space-y-4">
                    {/* Folder Header & Actions */}
                    <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
                      <div className="flex items-center gap-2">
                        <FolderOpen size={20} className="text-yellow-500" />
                        <h3 className="font-bold text-lg">{selectedFolder}</h3>
                      </div>
                      {selectedFolder !== 'All' && selectedFolder !== 'Unsorted' && (
                        <div className="flex gap-2">
                          <button onClick={() => renameFolder(selectedFolder)} className="text-xs font-bold text-blue-600 hover:underline">Rename Folder</button>
                          <span className="text-gray-300">|</span>
                          <button onClick={() => deleteFolder(selectedFolder)} className="text-xs font-bold text-red-600 hover:underline">Delete Folder</button>
                        </div>
                      )}
                    </div>

                    {/* Add Image Tool */}
                    <div className="bg-white p-4 rounded-xl border shadow-sm flex gap-4">
                      <input className="flex-1 p-2 border rounded" placeholder={`Add Image to '${selectedFolder}' (URL)...`} value={newImage} onChange={e => setNewImage(e.target.value)} />
                      <button onClick={addGalleryImage} className="bg-gray-800 text-white px-4 py-2 rounded text-sm font-bold">{editingGalleryId ? 'Update' : 'Add'}</button>
                      {editingGalleryId && <button onClick={() => { setEditingGalleryId(null); setNewImage(''); }} className="border px-4 py-2 rounded text-sm">Cancel</button>}
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {galleryImages.filter(img => selectedFolder === 'All' || (img.folder || 'Unsorted') === selectedFolder).length === 0 ? (
                        <div className="col-span-full text-center py-10 text-gray-400">
                          <ImageIcon size={48} className="mx-auto mb-2 opacity-20" />
                          <p>No images in this folder.</p>
                        </div>
                      ) : (
                        galleryImages
                          .filter(img => selectedFolder === 'All' || (img.folder || 'Unsorted') === selectedFolder)
                          .map(img => (
                            <div key={img.id} className="relative group rounded-lg overflow-hidden h-32 bg-gray-100 border">
                              <img
                                src={getOptimizedImageUrl(img.url || '')}
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Error'; }}
                              />
                              {/* Overlay - Always visible on mobile, hover on desktop */}
                              <div className="absolute inset-0 bg-black/40 md:opacity-0 md:group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity">
                                <button onClick={() => startEditGallery(img)} className="bg-white text-blue-600 p-2 rounded-full hover:bg-blue-50 shadow-md" title="Edit">
                                  <Edit2 size={16} />
                                </button>
                                <button onClick={() => deleteGalleryImage(img.id)} className="bg-white text-red-600 p-2 rounded-full hover:bg-red-50 shadow-md" title="Delete">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                              {/* Caption Badge */}
                              {img.caption && (
                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] p-1 truncate text-center">
                                  {img.caption}
                                </div>
                              )}
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          }

          {/* REELS TAB */}
          {
            activeTab === 'reels' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Reels Management</h2>
                  <p className="text-gray-500 text-sm">Upload videos to Mux or add links to existing reels</p>
                </div>

                {/* Mux Uploader Section */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-6">
                  <MuxUploader />
                </div>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-gray-50 text-gray-500 font-bold uppercase tracking-wide">Or Add by URL</span>
                  </div>
                </div>

                {/* URL-based Reel Management */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-700">Add Reel by URL</h3>
                  <div className="bg-white p-4 rounded-xl border shadow-sm flex gap-4">
                    <input
                      className="flex-1 p-2 border rounded"
                      placeholder="Video/Image URL (Drive, Instagram, YouTube, Mux Playback ID)"
                      value={newReel}
                      onChange={e => setNewReel(e.target.value)}
                    />
                    <button
                      onClick={addReel}
                      className="bg-gray-800 text-white px-4 py-2 rounded text-sm font-bold hover:bg-gray-700 transition-colors"
                    >
                      {editingReelId ? 'Update' : 'Add Reel'}
                    </button>
                    {editingReelId && (
                      <button
                        onClick={() => { setEditingReelId(null); setNewReel(''); }}
                        className="border px-4 py-2 rounded text-sm hover:bg-gray-100 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  {/* Existing Reels Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {reelsData.map(reel => (
                      <div key={reel.id} className="relative group rounded-lg overflow-hidden h-48 bg-black">
                        <img src={getOptimizedImageUrl(reel.thumbnail)} className="w-full h-full object-cover opacity-80" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                          <button onClick={() => startEditReel(reel)} className="text-white hover:text-blue-200"><Edit2 size={20} /></button>
                          <button onClick={() => deleteReel(reel.id)} className="text-white hover:text-red-200"><Trash2 size={20} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          }

          {/* MUSIC TAB */}
          {
            activeTab === 'music' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Playlist</h2>
                <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col md:flex-row gap-4">
                  <input className="flex-1 p-2 border rounded" placeholder="Song Title" value={newTrack.title} onChange={e => setNewTrack({ ...newTrack, title: e.target.value })} />
                  <input className="flex-1 p-2 border rounded" placeholder="Artist" value={newTrack.artist} onChange={e => setNewTrack({ ...newTrack, artist: e.target.value })} />
                  <button onClick={addTrack} className="bg-gray-800 text-white px-4 py-2 rounded text-sm font-bold">{editingTrackId ? 'Update' : 'Add Track'}</button>
                  {editingTrackId && <button onClick={() => { setEditingTrackId(null); setNewTrack({ title: '', artist: '' }); }} className="border px-4 py-2 rounded text-sm">Cancel</button>}
                </div>
                <div className="space-y-2">
                  {musicTracks.map(track => (
                    <div key={track.id} className="bg-white p-3 rounded-lg border flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded overflow-hidden"><img src={track.cover} className="w-full h-full object-cover" /></div>
                        <div><p className="font-bold text-sm">{track.title}</p><p className="text-xs text-gray-500">{track.artist}</p></div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => startEditTrack(track)} className="text-blue-400 hover:text-blue-600 p-2"><Edit2 size={18} /></button>
                        <button onClick={() => deleteTrack(track.id)} className="text-red-400 hover:text-red-600"><Trash2 size={18} /></button>
                      </div>
                    </div>

                  ))}
                </div>
              </div>
            )
          }

          {/* MESSAGE TAB */}
          {
            activeTab === 'message' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Special Message</h2>
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                  <textarea
                    className="w-full p-4 border rounded-xl text-lg font-script text-gray-700 focus:outline-none focus:border-rose-300"
                    rows={6}
                    value={birthdayMessage}
                    onChange={(e) => setBirthdayMessage(e.target.value)}
                  />
                  <div className="mt-4 flex justify-end text-sm text-gray-500">
                    Auto-saved
                  </div>
                </div>

                {/* FOLDER MANAGEMENT SECTION */}
                <div className="border-t pt-6 bg-gray-50 p-6 rounded-xl">
                  <h3 className="text-xl font-bold mb-4 text-gray-800">Media Folders</h3>
                  <p className="text-sm text-gray-500 mb-4">Create folders to organize surprise videos, audios, and images.</p>

                  {/* Create Folder */}
                  <div className="flex gap-2 mb-6">
                    <input
                      placeholder="New Folder Name (e.g. Surprise Video)"
                      className="p-2 border rounded flex-1"
                      id="new-folder-input"
                    />
                    <button
                      onClick={() => {
                        const input = document.getElementById('new-folder-input') as HTMLInputElement;
                        if (input.value) {
                          const newFolder = { id: Date.now().toString(), title: input.value, items: [] };
                          setWishFolders([...(wishFolders || []), newFolder]);
                          input.value = '';
                        }
                      }}
                      className="bg-gray-800 text-white px-4 py-2 rounded font-bold"
                    >
                      Create
                    </button>
                  </div>

                  {/* Folder List */}
                  <div className="space-y-4">
                    {wishFolders?.map(folder => (
                      <div key={folder.id} className="bg-white border rounded-xl overflow-hidden shadow-sm">
                        <div className="p-4 bg-gray-100 flex justify-between items-center border-b">
                          <h4 className="font-bold text-lg">{folder.title}</h4>
                          <button
                            onClick={() => setWishFolders(wishFolders.filter(f => f.id !== folder.id))}
                            className="text-red-500 hover:bg-red-100 p-2 rounded"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>

                        <div className="p-4">
                          {/* Add Item to Folder */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4 bg-gray-50 p-3 rounded">
                            <select id={`type-${folder.id}`} className="p-2 border rounded">
                              <option value="image">Image</option>
                              <option value="video">Video</option>
                              <option value="audio">Audio</option>
                              <option value="url">Link</option>
                            </select>
                            <input id={`url-${folder.id}`} placeholder="URL" className="p-2 border rounded col-span-2" />
                            <button
                              onClick={() => {
                                const typeEl = document.getElementById(`type-${folder.id}`) as HTMLSelectElement;
                                const urlEl = document.getElementById(`url-${folder.id}`) as HTMLInputElement;
                                if (urlEl.value) {
                                  const newItem = {
                                    id: Date.now().toString(),
                                    type: typeEl.value as any,
                                    url: urlEl.value,
                                    caption: 'New Item'
                                  };
                                  const updatedFolders = wishFolders.map(f => {
                                    if (f.id === folder.id) {
                                      return { ...f, items: [...(f.items || []), newItem] };
                                    }
                                    return f;
                                  });
                                  setWishFolders(updatedFolders);
                                  urlEl.value = '';
                                }
                              }}
                              className="bg-blue-600 text-white px-4 py-2 rounded font-bold"
                            >
                              Add
                            </button>
                          </div>

                          {/* Items Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {folder.items?.map(item => (
                              <div key={item.id} className="relative group border rounded-lg overflow-hidden bg-gray-50">
                                <div className="aspect-square flex items-center justify-center bg-gray-200">
                                  {item.type === 'image' && <img src={getOptimizedImageUrl(item.url)} className="w-full h-full object-cover" />}
                                  {item.type === 'video' && <PlayCircle size={32} className="text-gray-500" />}
                                  {item.type === 'audio' && <Music size={32} className="text-gray-500" />}
                                  {item.type === 'url' && <span className="text-xs break-all p-2">{item.url}</span>}
                                </div>
                                <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 rounded-bl">
                                  <button
                                    onClick={() => {
                                      const updatedFolders = wishFolders.map(f => {
                                        if (f.id === folder.id) {
                                          return { ...f, items: f.items.filter(i => i.id !== item.id) };
                                        }
                                        return f;
                                      });
                                      setWishFolders(updatedFolders);
                                    }}
                                    className="text-red-500"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                                <div className="p-2 text-xs font-bold text-center bg-white border-t uppercase text-gray-400">
                                  {item.type}
                                </div>
                              </div>
                            ))}
                            {(!folder.items || folder.items.length === 0) && (
                              <div className="col-span-full text-center text-gray-400 py-4 text-sm italic">
                                Empty folder. Add photos or videos above.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>


              </div>
            )
          }

          {/* NOTES TAB */}
          {
            activeTab === 'notes' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Moderation - Notes</h2>
                <div className="space-y-2">
                  {notes.length === 0 && <p className="text-gray-400">No notes yet.</p>}
                  {notes.map(note => (
                    <div key={note.id} className="bg-white p-4 rounded-lg border flex justify-between items-start">
                      <div>
                        <span className={`text-xs font-bold px-2 py-1 rounded ${note.author === 'Me' ? 'bg-rose-100 text-rose-600' : 'bg-gray-100 text-gray-600'}`}>{note.author}</span>
                        <p className="mt-2 text-gray-800">{note.text}</p>
                        <p className="text-xs text-gray-400 mt-1">{note.date}</p>
                      </div>
                      <button onClick={() => setNotes(notes.filter(n => n.id !== note.id))} className="text-red-400 hover:text-red-600"><Trash2 size={18} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )
          }

          {/* VAULT TAB */}
          {
            activeTab === 'vault' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Vault Security & Content</h2>

                <div className="bg-white p-6 rounded-xl border shadow-sm max-w-md mb-6">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Change Access PIN</label>
                  <input
                    type="text"
                    maxLength={4}
                    className="w-full p-3 border rounded-lg text-2xl tracking-[1em] font-mono text-center"
                    value={vaultPin}
                    onChange={(e) => setVaultPin(e.target.value.replace(/[^0-9]/g, ''))}
                  />
                  <p className="text-xs text-gray-500 mt-2">Current access code for the vault page.</p>
                </div>

                <h3 className="font-bold text-gray-700 mb-2">Manage Vault Content</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vaultItems.map(item => (
                    <div key={item.id} className="bg-white p-3 rounded-lg border flex justify-between items-center shadow-sm">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className={`w-8 h-8 rounded flex items-center justify-center text-white flex-shrink-0 ${item.type === 'image' ? 'bg-blue-400' : item.type === 'note' ? 'bg-yellow-400' : 'bg-purple-400'}`}>
                          {item.type === 'image' && <ImageIcon size={16} />}
                          {item.type === 'note' && <MessageCircle size={16} />}
                          {item.type === 'music' && <Music size={16} />}
                        </div>
                        <div className="truncate">
                          <p className="font-bold text-sm truncate">{item.label}</p>
                          <p className="text-xs text-gray-500 truncate">{item.content}</p>
                        </div>
                      </div>
                      <button onClick={() => setVaultItems(vaultItems.filter(v => v.id !== item.id))} className="text-red-400 hover:text-red-600"><Trash2 size={18} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )
          }

          {/* USERS TAB */}
          {
            activeTab === 'users' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">User Management</h2>

                {/* MPIN RESET REQUESTS */}
                {userList.some(u => u.mpinResetRequested) && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg mb-6">
                    <h3 className="text-lg font-bold text-red-700 flex items-center gap-2">
                      <Lock size={20} /> Security Requests
                    </h3>
                    <div className="mt-3 space-y-2">
                      {userList.filter(u => u.mpinResetRequested).map(user => (
                        <div key={user.uid} className="bg-white p-3 rounded shadow-sm flex justify-between items-center">
                          <div>
                            <p className="font-bold text-gray-800">{user.displayName || user.email}</p>
                            <p className="text-xs text-gray-500">Requested MPIN Reset for Vault/Admin</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={async () => {
                                if (confirm(`Reset MPIN and Clear Flag for ${user.displayName}?`)) {
                                  await update(ref(db, `users/${user.uid}`), { mpin: null, mpinResetRequested: false, failedMpinAttempts: 0 });
                                }
                              }}
                              className="px-3 py-1 bg-green-500 text-white rounded text-sm font-bold shadow-sm hover:bg-green-600 transition-colors"
                            >
                              Reset MPIN
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm("Deny request? The user will need to request again if they need help.")) {
                                  await update(ref(db, `users/${user.uid}`), { mpinResetRequested: false });
                                }
                              }}
                              className="px-3 py-1 bg-white border border-gray-300 text-gray-700 rounded text-sm font-bold hover:bg-gray-50 transition-colors"
                            >
                              Deny
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 text-gray-500 font-bold text-xs uppercase">
                        <tr>
                          <th className="p-4">User</th>
                          <th className="p-4">Role</th>
                          <th className="p-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {userList.map(user => (
                          <tr key={user.uid} className="hover:bg-gray-50">
                            <td className="p-4">
                              <div className="font-bold text-gray-900">{user.displayName || 'No Name'}</div>
                              <div className="text-xs text-gray-500">{user.email}</div>
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${user.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600'}`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="p-4 flex gap-2">
                              <button onClick={() => toggleUserRole(user)} className="text-blue-500 hover:text-blue-700 font-bold text-xs border border-blue-200 px-2 py-1 rounded">
                                Toggle Role
                              </button>
                              <button onClick={() => deleteUserRecord(user.uid)} className="text-red-500 hover:text-red-700 font-bold text-xs border border-red-200 px-2 py-1 rounded">
                                Delete
                              </button>
                              <button onClick={() => setPermissionUser(user)} className="text-purple-500 hover:text-purple-700 font-bold text-xs border border-purple-200 px-2 py-1 rounded">
                                Permissions
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )
          }

        </main>
      </div >

      {/* GLOBAL EDIT MODAL (Outside main scroll area) */}
      {/* GLOBAL EDIT MODAL */}
      {editingTimelineId && (
        // ... (Existing Modal Content) ...
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* ... content matching existing ... */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={cancelEditTimeline} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl relative z-10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Edit Timeline Event</h3>
              <button onClick={cancelEditTimeline} className="p-1 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            </div>
            {/* ... existing fields ... */}
            <div className="space-y-4">
              <div><label className="text-xs font-bold text-gray-500 uppercase">Year</label><input className="w-full p-3 border rounded-lg" value={newTimeline.year} onChange={e => setNewTimeline({ ...newTimeline, year: e.target.value })} placeholder="Year" /></div>
              <div><label className="text-xs font-bold text-gray-500 uppercase">Title</label><input className="w-full p-3 border rounded-lg" value={newTimeline.title} onChange={e => setNewTimeline({ ...newTimeline, title: e.target.value })} placeholder="Title" /></div>
              <div><label className="text-xs font-bold text-gray-500 uppercase">Description</label><textarea className="w-full p-3 border rounded-lg" value={newTimeline.description} onChange={e => setNewTimeline({ ...newTimeline, description: e.target.value })} placeholder="Description" rows={3} /></div>
              <div><label className="text-xs font-bold text-gray-500 uppercase">Image URL</label><input className="w-full p-3 border rounded-lg" value={newTimeline.image} onChange={e => setNewTimeline({ ...newTimeline, image: e.target.value })} placeholder="Image URL" /></div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={cancelEditTimeline} className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={addTimelineEvent} className="px-5 py-2.5 bg-gray-800 text-white font-bold rounded-lg hover:bg-gray-700 shadow-lg" >Save Changes</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* PERMISSION MODAL */}
      {permissionUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPermissionUser(null)} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl relative z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Manage Permissions</h3>
                <p className="text-sm text-gray-500">For {permissionUser.displayName || permissionUser.email}</p>
              </div>
              <button onClick={() => setPermissionUser(null)} className="p-1 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            </div>

            {/* Visibility Permissions Section */}
            <div className="mb-6">
              <h4 className="text-sm font-bold text-gray-700 uppercase mb-3 flex items-center gap-2">
                <Eye size={16} />
                View Access (Visibility)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries({
                  canViewTimeline: 'View Journey',
                  canViewGallery: 'View Gallery',
                  canViewReels: 'View Reels',
                  canViewMusic: 'View Music',
                  canViewNotes: 'View Notes',
                  canViewMessages: 'View Messages',
                  canViewVault: 'View Vault',
                  canViewFlipbook: 'View Flipbook',
                  canViewLinks: 'View Links',
                  canViewVideos: 'View Videos',
                  canViewVoiceNotes: 'View Voice Notes'
                }).map(([key, label]) => {
                  const permKey = key as keyof import('../types').UserPermissions;
                  const isEnabled = permissionUser.customPermissions?.[permKey] || false;
                  return (
                    <div key={key} className={`p-3 rounded-lg border-2 cursor-pointer transition-all flex justify-between items-center ${isEnabled ? 'border-green-500 bg-green-50' : 'border-gray-100 hover:border-gray-200'}`}
                      onClick={() => {
                        const newPerms = { ...permissionUser.customPermissions, [permKey]: !isEnabled };
                        setPermissionUser({ ...permissionUser, customPermissions: newPerms });
                      }}
                    >
                      <span className={`text-sm font-bold ${isEnabled ? 'text-green-700' : 'text-gray-600'}`}>{label}</span>
                      {isEnabled ? <Check size={18} className="text-green-600" /> : <div className="w-4 h-4 rounded-full border-2 border-gray-300" />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Edit & Access Permissions Section */}
            <div>
              <h4 className="text-sm font-bold text-gray-700 uppercase mb-3 flex items-center gap-2">
                <Settings size={16} />
                Edit & Access Permissions
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries({
                  canEditTimeline: 'Edit Timeline',
                  canEditGallery: 'Edit Gallery',
                  canEditReels: 'Edit Reels',
                  canEditMusic: 'Music Control',
                  canEditNotes: 'Moderate Notes',
                  canViewAdmin: 'Access Admin',
                  canEditCards: 'Edit Home Cards'
                }).map(([key, label]) => {
                  const permKey = key as keyof import('../types').UserPermissions;
                  const isEnabled = permissionUser.customPermissions?.[permKey] || false;
                  return (
                    <div key={key} className={`p-3 rounded-lg border-2 cursor-pointer transition-all flex justify-between items-center ${isEnabled ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}
                      onClick={() => {
                        const newPerms = { ...permissionUser.customPermissions, [permKey]: !isEnabled };
                        setPermissionUser({ ...permissionUser, customPermissions: newPerms });
                      }}
                    >
                      <span className={`text-sm font-bold ${isEnabled ? 'text-blue-700' : 'text-gray-600'}`}>{label}</span>
                      {isEnabled ? <Check size={18} className="text-blue-600" /> : <div className="w-4 h-4 rounded-full border-2 border-gray-300" />}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
              <button onClick={() => setPermissionUser(null)} className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-lg">Cancel</button>
              <button
                onClick={async () => {
                  if (!permissionUser.uid) return;
                  await update(ref(db, `users/${permissionUser.uid}`), { customPermissions: permissionUser.customPermissions });
                  setPermissionUser(null);
                }}
                className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg"
              >
                Save Permissions
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div >
  );
};

// Helper for icon
// Helper for icon
function SparklesIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /><path d="M5 3v4" /><path d="M9 3v4" /><path d="M3 5h4" /><path d="M3 9h4" /></svg>
  );
}

const HomeLayoutEditor: React.FC = () => {
  const [items, setItems] = useState([
    { id: '/journey', text: 'Journey (Our Story)' },
    { id: '/gallery', text: 'Gallery (Memories)' },
    { id: '/reels', text: 'Reels (Moments)' },
    { id: '/videos', text: 'Videos (Watch Together)' },
    { id: '/music', text: 'Music (Playlist)' },
    { id: '/notes', text: 'Notes (Letters)' },
    { id: '/vault', text: 'Vault (Private)' },
    { id: '/links', text: 'Links (Important)' },
    { id: '/flipbook', text: 'Storybook (Our Album)' },
    { id: '/voice-notes', text: 'Voice Notes (Conversations)' },
    { id: '/secret-message', text: 'Secret (Confidential)' },
    { id: '/complain', text: 'Complain (Issues)' },
    { id: '/wishes', text: 'Our Wishes (Dreams)' },
  ]);

  useEffect(() => {
    const orderRef = ref(db, 'settings/cardOrder');
    onValue(orderRef, (snapshot) => {
      if (snapshot.exists()) {
        const savedOrder: string[] = snapshot.val();
        setItems(prev => {
          const newOrder = [...prev].sort((a, b) => {
            const indexA = savedOrder.indexOf(a.id);
            const indexB = savedOrder.indexOf(b.id);
            const valA = indexA !== -1 ? indexA : 999;
            const valB = indexB !== -1 ? indexB : 999;
            return valA - valB;
          });
          return newOrder;
        });
      }
    }, { onlyOnce: true });
  }, []);

  const handleReorder = (newOrder: typeof items) => {
    setItems(newOrder);
    const orderIds = newOrder.map(item => item.id);
    set(ref(db, 'settings/cardOrder'), orderIds);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold">Home Screen Layout</h2>
        <p className="text-gray-500 text-sm">Drag and drop items to reorder them on the Home screen for everyone.</p>
      </div>

      <Reorder.Group axis="y" values={items} onReorder={handleReorder} className="space-y-2">
        {items.map((item) => (
          <Reorder.Item key={item.id} value={item}>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4 cursor-grab active:cursor-grabbing hover:border-blue-400 transition-colors">
              <div className="text-gray-400">
                <Layout size={20} />
              </div>
              <span className="font-semibold text-gray-700">{item.text}</span>
              <div className="ml-auto text-gray-300">
                <MoveUp size={16} className="rotate-45" />
              </div>
            </div>
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </div>
  );
};

export default Admin;