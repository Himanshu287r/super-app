"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import SidebarNav from "@/components/SidebarNav/SidebarNav";
import ChatList from "@/components/ChatList/ChatList";
import EmptyState from "@/components/EmptyState/EmptyState";
import ChatWindow from "@/components/ChatWindow/ChatWindow";
import CreateGroupModal from "@/components/Modals/CreateGroupModal";
import AICharacterModal from "@/components/Modals/AICharacterModal";
import AddContactModal from "@/components/Modals/AddContactModal";
import { INITIAL_CHATS, USERS, Chat, User } from '@/data/mockData';

export default function Home() {
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>(INITIAL_CHATS);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showTalkToAI, setShowTalkToAI] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
      router.push('/login');
    } else {
      setIsLoading(false);
    }
  }, [router]);

  const handleCreateGroup = (name: string, participantIds: string[]) => {
    const participants = USERS.filter(u => participantIds.includes(u.id));
    const newChat: Chat = {
      id: Date.now().toString(),
      isGroup: true,
      groupName: name,
      participants: participants,
      messages: [],
      unreadCount: 0
    };
    setChats(prev => [newChat, ...prev]);
    setSelectedChatId(newChat.id);
    setShowCreateGroup(false);
  };

  const handleCreateAIChat = (aiId: string) => {
    const aiUser = USERS.find(u => u.id === aiId);
    if (!aiUser) return;

    // Check if chat already exists
    const existing = chats.find(c => !c.isGroup && c.participants[0].id === aiId);
    if (existing) {
      setSelectedChatId(existing.id);
      setShowTalkToAI(false);
      return;
    }

    const newChat: Chat = {
      id: Date.now().toString(),
      participants: [aiUser],
      messages: [],
      unreadCount: 0
    };
    setChats(prev => [newChat, ...prev]);
    setSelectedChatId(newChat.id);
    setShowTalkToAI(false);
  }

  const handleAddContact = (email: string) => {
    const newUser: User = {
      id: Date.now().toString(),
      name: email.split('@')[0],
      isOnline: false,
      avatar: undefined
    };

    const newChat: Chat = {
      id: Date.now().toString(),
      participants: [newUser],
      messages: [],
      unreadCount: 0
    };
    setChats(prev => [newChat, ...prev]);
    setSelectedChatId(newChat.id);
    setShowAddContact(false);
  }

  const handleSendMessage = (chatId: string, text: string) => {
    setChats(prevChats => prevChats.map(chat => {
      if (chat.id !== chatId) return chat;

      const newMessage = {
        id: Date.now().toString(),
        senderId: 'me',
        text: text,
        timestamp: new Date().toISOString(),
        isRead: true
      };

      // AI Logic
      const aiParticipant = chat.participants.find(p => p.isAI);
      if (aiParticipant) {
        setTimeout(() => {
          setChats(currentChats => currentChats.map(c => {
            if (c.id !== chatId) return c;
            return {
              ...c,
              messages: [...c.messages, {
                id: (Date.now() + 1).toString(),
                senderId: aiParticipant.id,
                text: `[AI ${aiParticipant.name}]: ${text}`, // Echo for now
                timestamp: new Date().toISOString(),
                isRead: true
              }]
            }
          }))
        }, 1000);
      }

      return {
        ...chat,
        messages: [...chat.messages, newMessage]
      };
    }));
  }

  if (isLoading) return null;

  const selectedChat = chats.find(c => c.id === selectedChatId);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <SidebarNav />
      <ChatList
        chats={chats}
        onSelectChat={setSelectedChatId}
        selectedChatId={selectedChatId}
        onAddContact={() => setShowAddContact(true)}
        onCreateGroup={() => setShowCreateGroup(true)}
        onTalkToAI={() => setShowTalkToAI(true)}
      />

      <main style={{ flex: 1, display: 'flex' }}>
        {selectedChatId && selectedChat ? (
          <ChatWindow chat={selectedChat} onSendMessage={(text) => handleSendMessage(selectedChatId, text)} />
        ) : (
          <EmptyState />
        )}
      </main>

      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onCreate={handleCreateGroup}
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
