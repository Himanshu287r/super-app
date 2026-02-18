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

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

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
    // While redirecting, render nothing (Suspense fallback from app/page.tsx will show if needed)
    return null;
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

