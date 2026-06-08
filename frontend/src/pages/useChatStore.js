import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import { useThemeStore } from "../components/useThemeStore";

const playSendSound = () => {
  if (useThemeStore.getState().soundMuted) return;
  try {
    const preset = useThemeStore.getState().soundPreset || "classic";
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (preset === "retro") {
      osc.type = "square";
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (preset === "bubble") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
      osc.start();
      osc.stop(ctx.currentTime + 0.07);
    } else if (preset === "digital") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(980, ctx.currentTime);
      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } else {
      // classic / default
      osc.type = "sine";
      osc.frequency.setValueAtTime(350, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    }
  } catch (e) {
    console.error("Audio error:", e);
  }
};

const playReceiveSound = () => {
  if (useThemeStore.getState().soundMuted) return;
  try {
    const preset = useThemeStore.getState().soundPreset || "classic";
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    
    const playTone = (freq, type, duration, delay = 0, volume = 0.05) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration);
    };

    if (preset === "retro") {
      playTone(400, "square", 0.06, 0, 0.03);
      playTone(600, "square", 0.08, 0.06, 0.03);
    } else if (preset === "bubble") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (preset === "digital") {
      playTone(1200, "triangle", 0.05, 0, 0.03);
      playTone(1500, "triangle", 0.05, 0.04, 0.03);
      playTone(1800, "triangle", 0.07, 0.08, 0.03);
    } else {
      // classic / default
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(550, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }
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
  replyingToMessage: null,
  globalSearchUsersList: [],
  globalSearchMessagesList: [],
  isGlobalUsersLoading: false,
  isGlobalMessagesLoading: false,

  setReplyingToMessage: (message) => set({ replyingToMessage: message }),

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
    const { selectedUser, messages, replyingToMessage } = get();
    try {
      const payload = { ...messageData };
      if (replyingToMessage) {
        payload.replyTo = replyingToMessage._id;
      }
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, payload);
      set({ 
        messages: [...messages, res.data.message],
        replyingToMessage: null
      });
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

  globalSearchUsers: async (query) => {
    if (!query) {
      set({ globalSearchUsersList: [] });
      return;
    }
    set({ isGlobalUsersLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/users/search?query=${query}`);
      set({ globalSearchUsersList: res.data.users });
    } catch (error) {
      console.error("Global user search failed:", error);
    } finally {
      set({ isGlobalUsersLoading: false });
    }
  },

  globalSearchMessages: async (query) => {
    if (!query) {
      set({ globalSearchMessagesList: [] });
      return;
    }
    set({ isGlobalMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/search/all?query=${query}`);
      set({ globalSearchMessagesList: res.data.messages });
    } catch (error) {
      console.error("Global message search failed:", error);
    } finally {
      set({ isGlobalMessagesLoading: false });
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

  setSelectedUser: (selectedUser) => set({ selectedUser, typingUsers: {}, replyingToMessage: null }),
}));