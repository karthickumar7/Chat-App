import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5001" : "/";

let ringtoneInterval = null;
const playCallRingingSound = () => {
  if (ringtoneInterval) return;
  const playTone = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(480, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch (e) {
      console.log(e);
    }
  };
  playTone();
  ringtoneInterval = setInterval(playTone, 2000);
};

const stopAllCallSounds = () => {
  if (ringtoneInterval) {
    clearInterval(ringtoneInterval);
    ringtoneInterval = null;
  }
};

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  socket: null,
  onlineUsers: [],
  
  // Voice Calling State
  activeCall: false,
  callStatus: "idle", // idle, calling, ringing, connected
  isIncoming: false,
  isCaller: false,
  callPartner: null,
  offer: null,
  answer: null,
  incomingIceCandidate: null,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
      get().connectSocket();
    } catch {
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      toast.success("Account created successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response?.data?.msg || "Signup failed");
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data.user });
      toast.success("Logged in successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response?.data?.msg || "Login failed");
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      toast.error(error.response?.data?.msg || "Logout failed");
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/user/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("error in update profile:", error);
      toast.error(error.response?.data?.msg || "Update failed");
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  forgotPassword: async (email) => {
    try {
      const res = await axiosInstance.post("/auth/forgot-password", { email });
      toast.success(res.data.msg || "Reset link printed to server logs!");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.msg || "Failed to request reset link");
      return false;
    }
  },

  resetPassword: async (token, password) => {
    try {
      const res = await axiosInstance.post(`/auth/reset-password/${token}`, { password });
      toast.success(res.data.msg || "Password reset successfully!");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.msg || "Failed to reset password");
      return false;
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    try {
      const res = await axiosInstance.post("/auth/change-password", { currentPassword, newPassword });
      toast.success(res.data.msg || "Password changed successfully!");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.msg || "Failed to change password");
      return false;
    }
  },

  connectSocket: () => {
    const { authUser, socket } = get();
    if (!authUser || (socket && socket.connected)) return;

    const newSocket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
    });
    newSocket.connect();

    set({ socket: newSocket });

    newSocket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });

    // Real-time voice call signaling handlers
    newSocket.on("incomingCall", ({ from, name, pic, offer }) => {
      set({
        activeCall: true,
        callStatus: "ringing",
        isIncoming: true,
        isCaller: false,
        callPartner: { _id: from, fullName: name, profilePic: pic },
        offer
      });
      playCallRingingSound();
    });

    newSocket.on("callAccepted", ({ answer }) => {
      set({ callStatus: "connected", answer });
      stopAllCallSounds();
    });

    newSocket.on("callRejected", () => {
      set({
        activeCall: false,
        callStatus: "idle",
        isIncoming: false,
        isCaller: false,
        callPartner: null,
        offer: null,
        answer: null,
        incomingIceCandidate: null
      });
      stopAllCallSounds();
      toast.error("Call declined");
    });

    newSocket.on("callEnded", () => {
      set({
        activeCall: false,
        callStatus: "idle",
        isIncoming: false,
        isCaller: false,
        callPartner: null,
        offer: null,
        answer: null,
        incomingIceCandidate: null
      });
      stopAllCallSounds();
      toast("Call ended");
    });

    newSocket.on("iceCandidate", ({ candidate }) => {
      set({ incomingIceCandidate: candidate });
    });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket && socket.connected) {
      socket.off("incomingCall");
      socket.off("callAccepted");
      socket.off("callRejected");
      socket.off("callEnded");
      socket.off("iceCandidate");
      socket.disconnect();
    }
    stopAllCallSounds();
    set({ 
      socket: null,
      activeCall: false,
      callStatus: "idle",
      isIncoming: false,
      isCaller: false,
      callPartner: null,
      offer: null,
      answer: null,
      incomingIceCandidate: null
    });
  },

  startCall: (userToCall, offer) => {
    const { socket, authUser } = get();
    if (!socket || !authUser) return;

    set({
      activeCall: true,
      callStatus: "calling",
      isIncoming: false,
      isCaller: true,
      callPartner: userToCall,
      offer
    });

    socket.emit("callUser", {
      userToCall: userToCall._id,
      from: authUser._id,
      name: authUser.fullName,
      pic: authUser.profilePic,
      offer
    });

    playCallRingingSound();
  },

  acceptIncomingCall: (answer) => {
    const { socket, callPartner } = get();
    if (!socket || !callPartner) return;

    set({ callStatus: "connected", answer });
    socket.emit("acceptCall", { to: callPartner._id, answer });
    stopAllCallSounds();
  },

  rejectIncomingCall: () => {
    const { socket, callPartner } = get();
    if (!socket || !callPartner) return;

    set({
      activeCall: false,
      callStatus: "idle",
      isIncoming: false,
      isCaller: false,
      callPartner: null,
      offer: null,
      answer: null,
      incomingIceCandidate: null
    });

    socket.emit("rejectCall", { to: callPartner._id });
    stopAllCallSounds();
  },

  hangupCall: () => {
    const { socket, callPartner } = get();
    if (!socket || !callPartner) return;

    set({
      activeCall: false,
      callStatus: "idle",
      isIncoming: false,
      isCaller: false,
      callPartner: null,
      offer: null,
      answer: null,
      incomingIceCandidate: null
    });

    socket.emit("endCall", { to: callPartner._id });
    stopAllCallSounds();
  },

  blockUser: async (userId) => {
    try {
      const res = await axiosInstance.post(`/messages/block/${userId}`);
      set({ authUser: { ...get().authUser, blockedUsers: res.data.blockedUsers } });
      toast.success("User blocked");
    } catch (error) {
      toast.error(error.response?.data?.msg || "Failed to block user");
    }
  },

  unblockUser: async (userId) => {
    try {
      const res = await axiosInstance.post(`/messages/unblock/${userId}`);
      set({ authUser: { ...get().authUser, blockedUsers: res.data.blockedUsers } });
      toast.success("User unblocked");
    } catch (error) {
      toast.error(error.response?.data?.msg || "Failed to unblock user");
    }
  },
}));