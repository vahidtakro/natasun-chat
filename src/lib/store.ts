"use client";

import { create } from "zustand";

export type Conversation = {
  id: string;
  status: string;
  visitorName: string | null;
  visitorEmail: string | null;
  lastMessage: string | null;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
  agentId?: string | null;
  agent?: { id: string; name: string; avatar: string | null } | null;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  agentId?: string | null;
  content: string;
  type: string;
  isAgent: boolean;
  read: boolean;
  createdAt: string;
  agent?: { id: string; name: string; avatar: string | null } | null;
};

type Updater = Conversation[] | ((prev: Conversation[]) => Conversation[]);

type ConversationStore = {
  conversations: Conversation[];
  activeConversationId: string | null;
  typing: boolean;
  setConversations: (c: Updater) => void;
  upsertConversation: (c: Conversation) => void;
  setActiveConversation: (id: string | null) => void;
  setTyping: (t: boolean) => void;
};

export const useConversationStore = create<ConversationStore>((set) => ({
  conversations: [],
  activeConversationId: null,
  typing: false,
  setConversations: (c) => set((s) => ({ conversations: typeof c === "function" ? c(s.conversations) : c })),
  upsertConversation: (c) =>
    set((s) => {
      const exists = s.conversations.some((x) => x.id === c.id);
      if (exists) {
        return {
          conversations: s.conversations.map((x) => (x.id === c.id ? { ...x, ...c } : x)),
        };
      }
      return { conversations: [c, ...s.conversations] };
    }),
  setActiveConversation: (id) => set({ activeConversationId: id }),
  setTyping: (t) => set({ typing: t }),
}));

export const useSocket = create<{ socket: any; connected: boolean }>(() => ({
  socket: null,
  connected: false,
}));
