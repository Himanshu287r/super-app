"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import SidebarNav from "@/components/SidebarNav/SidebarNav";
import ChatList from "@/components/ChatList/ChatList";
import EmptyState from "@/components/EmptyState/EmptyState";
import ChatWindow from "@/components/ChatWindow/ChatWindow";
import CreateGroupModal from "@/components/Modals/CreateGroupModal";
import AICharacterModal from "@/components/Modals/AICharacterModal";
import AddContactModal from "@/components/Modals/AddContactModal";
import { useAuth } from '@/context/AuthContext';
import { ChatDoc, subscribeToUserChats, createDirectChat, createGroupChat } from '@/lib/services/chatService';
import { sendMessage } from '@/lib/services/messageService';
import { searchUserByEmail, UserProfile, subscribeToUsers } from '@/lib/services/userService';
import { setOnlineStatus } from '@/lib/services/userService';

export default function HomeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, logout } = useAuth();

  const [chats, setChats] = useState<ChatDoc[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showTalkToAI, setShowTalkToAI] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [usersMap, setUsersMap] = useState<Map<string, UserProfile>>(new Map());

  // Set online status and handle browser close
  useEffect(() => {
    if (!user) return;

    setOnlineStatus(user.uid, true);

    const handleBeforeUnload = () => {
      setOnlineStatus(user.uid, false);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      setOnlineStatus(user.uid, false);
    };
  }, [user]);

  // Subscribe to chats
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToUserChats(user.uid, (newChats) => {
      setChats(newChats);
    });

    return () => unsubscribe();
  }, [user]);

  // Handle chatId from URL params (e.g., when returning from profile)
  useEffect(() => {
    const chatIdFromUrl = searchParams.get('chatId');
    if (chatIdFromUrl && chats.length > 0) {
      // Verify the chat exists before setting it
      const chatExists = chats.some(chat => chat.id === chatIdFromUrl);
      if (chatExists) {
        setSelectedChatId(chatIdFromUrl);
        // Clean up URL by removing the query parameter
        router.replace('/');
      }
    }
  }, [searchParams, chats, router]);

  // Subscribe to all participant users for real-time presence
  useEffect(() => {
    if (!user || chats.length === 0) return;

    // Collect all unique user IDs from all chats
    const allUserIds = new Set<string>();
    chats.forEach((chat) => {
      chat.participants.forEach((pid) => {
        if (pid !== user.uid) {
          allUserIds.add(pid);
        }
      });
    });

    if (allUserIds.size === 0) return;

    const unsubscribe = subscribeToUsers(Array.from(allUserIds), (users) => {
      setUsersMap(new Map(users));
    });

    return () => unsubscribe();
  }, [user, chats]);

  const handleCreateGroup = async (name: string, participantIds: string[], groupInfo?: string | null) => {
    if (!user) return;
    try {
      const chatId = await createGroupChat(name, participantIds, user.uid, groupInfo);
      setSelectedChatId(chatId);
      setShowCreateGroup(false);
    } catch (err) {
      console.error('Failed to create group:', err);
    }
  };

  const handleCreateAIChat = (aiId: string) => {
    // AI chat remains local for now — can be extended with an AI API later
    setShowTalkToAI(false);
    alert('AI chat feature coming soon! Connect an AI API to enable this.');
  };

  const handleAddContact = async (email: string) => {
    if (!user) return;

    try {
      const foundUser = await searchUserByEmail(email);
      if (!foundUser) {
        alert('No user found with that email. They need to sign up first!');
        return;
      }

      if (foundUser.uid === user.uid) {
        alert("That's your own email!");
        return;
      }

      const chatId = await createDirectChat(user.uid, foundUser.uid);
      setSelectedChatId(chatId);
      setShowAddContact(false);
    } catch (err) {
      console.error('Failed to add contact:', err);
      alert('Something went wrong. Please try again.');
    }
  };

  const handleSendMessage = async (chatId: string, text: string) => {
    if (!user) return;
    try {
      await sendMessage(chatId, user.uid, text);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleLogout = async () => {
    if (user) {
      await setOnlineStatus(user.uid, false);
    }
    await logout();
  };

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--background)',
        color: 'var(--foreground)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid var(--border-color)',
            borderTop: '3px solid var(--primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem',
          }} />
          <p style={{ color: 'var(--muted-foreground)' }}>Loading...</p>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'radial-gradient(circle at top, rgba(59,130,246,0.25), transparent 55%), var(--background)',
          color: 'var(--foreground)',
          padding: '2rem',
        }}
      >
        <div
          style={{
            maxWidth: '640px',
            width: '100%',
            backgroundColor: 'rgba(15,23,42,0.8)',
            borderRadius: '1.5rem',
            padding: '2.5rem 2.25rem',
            boxShadow:
              '0 24px 60px rgba(15,23,42,0.65), 0 0 0 1px rgba(148,163,184,0.15)',
            border: '1px solid rgba(148,163,184,0.35)',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0.2rem 0.7rem',
              borderRadius: '999px',
              backgroundColor: 'rgba(15,118,110,0.15)',
              border: '1px solid rgba(45,212,191,0.5)',
              marginBottom: '1.5rem',
              fontSize: '0.75rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#5eead4',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: '6px',
                height: '6px',
                borderRadius: '999px',
                backgroundColor: '#22c55e',
                marginRight: '0.4rem',
                boxShadow: '0 0 0 4px rgba(34,197,94,0.3)',
              }}
            />
            Live chat • Calls • Media
          </div>

          <h1
            style={{
              fontSize: 'clamp(2.4rem, 3vw, 3rem)',
              lineHeight: 1.1,
              fontWeight: 700,
              marginBottom: '0.9rem',
            }}
          >
            Welcome to your modern messaging workspace
          </h1>
          <p
            style={{
              fontSize: '0.98rem',
              lineHeight: 1.7,
              color: 'var(--muted-foreground)',
              marginBottom: '1.9rem',
            }}
          >
            Chat in real time, jump into 1:1 or group calls, share media, polls,
            and locations — all in one sleek, minimal interface built for focus.
          </p>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.75rem',
              marginBottom: '2.1rem',
            }}
          >
            <button
              onClick={() => router.push('/login')}
              style={{
                padding: '0.8rem 1.5rem',
                borderRadius: '999px',
                border: 'none',
                outline: 'none',
                cursor: 'pointer',
                background:
                  'linear-gradient(135deg, #4f46e5, #0ea5e9, #22c55e)',
                color: 'white',
                fontWeight: 600,
                fontSize: '0.95rem',
                boxShadow:
                  '0 18px 40px rgba(15,23,42,0.8), 0 0 0 1px rgba(191,219,254,0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
              }}
            >
              Get started
              <span style={{ fontSize: '1.1rem', transform: 'translateY(1px)' }}>
                →
              </span>
            </button>

            <button
              onClick={() => router.push('/login')}
              style={{
                padding: '0.8rem 1.3rem',
                borderRadius: '999px',
                border: '1px solid rgba(148,163,184,0.6)',
                backgroundColor: 'rgba(15,23,42,0.7)',
                color: 'var(--muted-foreground)',
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              Sign in to your account
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: '0.9rem',
              fontSize: '0.78rem',
              color: 'var(--muted-foreground)',
            }}
          >
            <div
              style={{
                padding: '0.75rem 0.6rem',
                borderRadius: '0.9rem',
                backgroundColor: 'rgba(15,23,42,0.9)',
                border: '1px solid rgba(30,64,175,0.8)',
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#bfdbfe',
                  marginBottom: '0.3rem',
                }}
              >
                Real-time messaging
              </div>
              <div>Typing indicators, presence, and instant delivery.</div>
            </div>
            <div
              style={{
                padding: '0.75rem 0.6rem',
                borderRadius: '0.9rem',
                backgroundColor: 'rgba(15,23,42,0.9)',
                border: '1px solid rgba(5,150,105,0.8)',
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#a7f3d0',
                  marginBottom: '0.3rem',
                }}
              >
                Voice & video calls
              </div>
              <div>Start rich WebRTC calls directly from any chat.</div>
            </div>
            <div
              style={{
                padding: '0.75rem 0.6rem',
                borderRadius: '0.9rem',
                backgroundColor: 'rgba(15,23,42,0.9)',
                border: '1px solid rgba(99,102,241,0.8)',
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#c7d2fe',
                  marginBottom: '0.3rem',
                }}
              >
                Rich attachments
              </div>
              <div>Media, polls, and locations in a single timeline.</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const selectedChat = chats.find(c => c.id === selectedChatId);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <SidebarNav user={user} onLogout={handleLogout} />
      <ChatList
        chats={chats}
        currentUserId={user.uid}
        usersMap={usersMap}
        onSelectChat={setSelectedChatId}
        selectedChatId={selectedChatId}
        onAddContact={() => setShowAddContact(true)}
        onCreateGroup={() => setShowCreateGroup(true)}
        onTalkToAI={() => setShowTalkToAI(true)}
      />

      <main style={{ flex: 1, display: 'flex' }}>
        {selectedChatId && selectedChat ? (
          <ChatWindow
            chat={selectedChat}
            currentUserId={user.uid}
            usersMap={usersMap}
            onSendMessage={(text) => handleSendMessage(selectedChatId, text)}
          />
        ) : (
          <EmptyState />
        )}
      </main>

      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onCreate={handleCreateGroup}
        currentUserId={user.uid}
        usersMap={usersMap}
      />
      <AICharacterModal
        isOpen={showTalkToAI}
        onClose={() => setShowTalkToAI(false)}
        onSelect={handleCreateAIChat}
      />
      <AddContactModal
        isOpen={showAddContact}
        onClose={() => setShowAddContact(false)}
        onAdd={handleAddContact}
      />
    </div>
  );
}

