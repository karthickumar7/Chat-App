import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import { useThemeStore } from "../components/useThemeStore";

const playSendSound = () => {
  if (useThemeStore.getState().soundMuted) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    // Whoosh / rising pop sound for sending
    osc.frequency.setValueAtTime(350, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.08);
    
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch (e) {
    console.error("Audio error:", e);
  }
};

const playReceiveSound = () => {
  if (useThemeStore.getState().soundMuted) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    // Dual-tone high pitch ping sound for receiving
    osc.frequency.setValueAtTime(550, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch (e) {
    console.error("Audio error:", e);
  }
};

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  typingUsers: {}, // Maps userId -> boolean

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data.users });
    } catch (error) {
      toast.error(error.response?.data?.msg || "Failed to load users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data.messages });
      get().markMessagesAsRead(userId);
    } catch (error) {
      toast.error(error.response?.data?.msg || "Failed to load messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data.message] });
      playSendSound();
    } catch (error) {
      toast.error(error.response?.data?.msg || "Failed to send message");
    }
  },

  deleteMessage: async (messageId) => {
    try {
      await axiosInstance.delete(`/messages/${messageId}`);
      set({
        messages: get().messages.filter((msg) => msg._id !== messageId)
      });
      toast.success("Message deleted");
    } catch (error) {
      toast.error(error.response?.data?.msg || "Failed to delete message");
    }
  },

  addReaction: async (messageId, emoji) => {
    try {
      const res = await axiosInstance.post(`/messages/react/${messageId}`, { emoji });
      const updatedMessages = get().messages.map((msg) => {
        if (msg._id === messageId) {
          return res.data.message;
        }
        return msg;
      });
      set({ messages: updatedMessages });
    } catch (error) {
      toast.error(error.response?.data?.msg || "Failed to add reaction");
    }
  },

  clearChat: async (partnerId) => {
    try {
      await axiosInstance.delete(`/messages/clear/${partnerId}`);
      set({ messages: [] });
      toast.success("Chat history cleared!");
    } catch (error) {
      toast.error(error.response?.data?.msg || "Failed to clear chat");
    }
  },

  markMessagesAsRead: async (senderId) => {
    try {
      await axiosInstance.put(`/messages/read/${senderId}`);
      const updatedMessages = get().messages.map((msg) => {
        if (msg.senderId === senderId) {
          return { ...msg, isRead: true };
        }
        return msg;
      });
      set({ messages: updatedMessages });
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("newMessage", (newMessage) => {
      const isMessageFromSelectedUser = newMessage.senderId === selectedUser._id;
      if (!isMessageFromSelectedUser) return;

      set({ messages: [...get().messages, newMessage] });
      playReceiveSound();
      // Auto-read incoming message if chat is active
      get().markMessagesAsRead(selectedUser._id);
    });

    socket.on("userTyping", ({ senderId }) => {
      if (senderId === selectedUser._id) {
        set({
          typingUsers: { ...get().typingUsers, [senderId]: true }
        });
      }
    });

    socket.on("userStopTyping", ({ senderId }) => {
      if (senderId === selectedUser._id) {
        const typing = { ...get().typingUsers };
        delete typing[senderId];
        set({ typingUsers: typing });
      }
    });

    socket.on("messageDeleted", (messageId) => {
      set({
        messages: get().messages.filter((msg) => msg._id !== messageId)
      });
    });

    socket.on("messageReaction", ({ messageId, userId, emoji }) => {
      const updatedMessages = get().messages.map((msg) => {
        if (msg._id === messageId) {
          const reactions = [...(msg.reactions || [])];
          const existingIdx = reactions.findIndex((r) => r.userId === userId);
          if (existingIdx > -1) {
            reactions[existingIdx].emoji = emoji;
          } else {
            reactions.push({ userId, emoji });
          }
          return { ...msg, reactions };
        }
        return msg;
      });
      set({ messages: updatedMessages });
    });

    socket.on("messagesRead", ({ readerId }) => {
      const updatedMessages = get().messages.map((msg) => {
        if (msg.receiverId === readerId) {
          return { ...msg, isRead: true };
        }
        return msg;
      });
      set({ messages: updatedMessages });
    });

    socket.on("chatCleared", () => {
      set({ messages: [] });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.off("newMessage");
    socket.off("userTyping");
    socket.off("userStopTyping");
    socket.off("messageDeleted");
    socket.off("messageReaction");
    socket.off("messagesRead");
    socket.off("chatCleared");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser, typingUsers: {} }),
}));