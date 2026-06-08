import { X, Phone, ArrowLeft, Search, Trash2, MoreVertical, Star, Ban } from "lucide-react";
import { useAuthStore } from "../pages/useAuthStore";
import { useChatStore } from "../pages/useChatStore";
import { useState } from "react";

const ChatHeader = ({ 
  onToggleSearch, 
  onClearChat, 
  onToggleStarredDrawer, 
  onWallpaperChange, 
  disappearingTime, 
  onDisappearingTimeChange 
}) => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers, startCall, authUser, blockUser, unblockUser } = useAuthStore();
  const [showDropdown, setShowDropdown] = useState(false);

  const isOnline = selectedUser ? onlineUsers.includes(selectedUser._id) : false;
  const isBlocked = authUser?.blockedUsers?.includes(selectedUser?._id);

  if (!selectedUser) return null;

  const formatLastSeen = (dateString) => {
    if (!dateString) return "Offline";
    const diffMs = new Date() - new Date(dateString);
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(dateString).toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div className="p-2.5 border-b border-base-300 bg-base-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Back Button on Mobile */}
          <button 
            onClick={() => setSelectedUser(null)} 
            className="md:hidden btn btn-ghost btn-circle btn-sm -ml-1.5"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Avatar */}
          <div className="avatar">
            <div className="size-10 rounded-full relative">
              <img src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.fullName} />
            </div>
          </div>

          {/* User info */}
          <div>
            <h3 className="font-semibold text-sm flex items-center gap-1.5">
              {selectedUser.fullName}
              {selectedUser.nickName && (
                <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-full font-normal">
                  {selectedUser.nickName}
                </span>
              )}
            </h3>
            <p className="text-[10px] text-base-content/60">
              {isOnline ? (
                <span className="text-green-500 font-semibold">Online</span>
              ) : (
                `Last seen ${formatLastSeen(selectedUser.lastSeen)}`
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Search Messages Toggle */}
          <button 
            onClick={onToggleSearch} 
            className="btn btn-ghost btn-circle btn-sm text-base-content/75 hover:bg-base-200"
            title="Search Messages"
          >
            <Search className="w-4.5 h-4.5" />
          </button>

          {/* Voice Call Button (Only shown if online and not blocked) */}
          {isOnline && !isBlocked && (
            <button 
              onClick={() => startCall(selectedUser)} 
              className="btn btn-ghost btn-circle btn-sm text-primary hover:bg-primary/10"
              title="Start Voice Call"
            >
              <Phone className="w-4.5 h-4.5" />
            </button>
          )}

          {/* Actions Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowDropdown(!showDropdown)} 
              className="btn btn-ghost btn-circle btn-sm text-base-content/75 hover:bg-base-200"
              title="More Options"
            >
              <MoreVertical className="w-4.5 h-4.5" />
            </button>
            {showDropdown && (
              <div className="absolute right-0 mt-1.5 w-48 bg-base-200 border border-base-300 rounded-lg shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
                {/* Starred Messages Option */}
                <button
                  onClick={() => {
                    onToggleStarredDrawer();
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-base-300 transition-colors flex items-center gap-2 font-semibold text-base-content/85"
                >
                  <Star className="w-3.5 h-3.5 text-yellow-500" /> Starred Messages
                </button>

                {/* Disappearing Messages Option */}
                <div className="border-t border-base-300 my-1"></div>
                <div className="px-3.5 py-1 font-bold text-[10px] text-zinc-500 uppercase tracking-wider">
                  Self-Destruct Messages
                </div>
                {[
                  { label: "Off", value: null },
                  { label: "5 seconds", value: 5 },
                  { label: "10 seconds", value: 10 },
                  { label: "30 seconds", value: 30 },
                  { label: "1 minute", value: 60 }
                ].map((option) => (
                  <button
                    key={option.label}
                    onClick={() => {
                      onDisappearingTimeChange(option.value);
                      setShowDropdown(false);
                    }}
                    className={`w-full text-left px-3.5 py-1.5 hover:bg-base-300 transition-colors flex items-center justify-between font-semibold ${
                      disappearingTime === option.value ? "text-primary bg-base-300/40" : "text-base-content/75"
                    }`}
                  >
                    <span>{option.label}</span>
                    {disappearingTime === option.value && <span className="size-1.5 bg-primary rounded-full" />}
                  </button>
                ))}

                {/* Wallpaper Picker Option */}
                <div className="border-t border-base-300 my-1"></div>
                <div className="px-3.5 py-1 font-bold text-[10px] text-zinc-500 uppercase tracking-wider">
                  Chat Wallpaper
                </div>
                {[
                  { label: "Classic Grey", value: "bg-base-100" },
                  { label: "Sunset Glow", value: "bg-gradient-to-tr from-orange-500/10 via-pink-500/10 to-purple-600/10" },
                  { label: "Midnight Blue", value: "bg-gradient-to-b from-blue-950/20 via-slate-900/20 to-zinc-950/20" },
                  { label: "Glassy Teal", value: "bg-gradient-to-br from-teal-500/10 to-indigo-500/10" },
                  { label: "Soft Lavender", value: "bg-gradient-to-tr from-purple-300/10 to-indigo-400/10" }
                ].map((wp) => (
                  <button
                    key={wp.label}
                    onClick={() => {
                      onWallpaperChange(wp.value);
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-3.5 py-1.5 hover:bg-base-300 transition-colors flex items-center gap-2 text-base-content/75 font-semibold"
                  >
                    <div className={`size-3 rounded-full border border-base-300 ${wp.value}`} />
                    <span>{wp.label}</span>
                  </button>
                ))}

                {/* Block / Unblock Option */}
                <div className="border-t border-base-300 my-1"></div>
                <button
                  onClick={() => {
                    if (isBlocked) {
                      unblockUser(selectedUser._id);
                    } else {
                      if (window.confirm(`Are you sure you want to block ${selectedUser.fullName}? You will not be able to message or call each other.`)) {
                        blockUser(selectedUser._id);
                      }
                    }
                    setShowDropdown(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 hover:bg-base-300 transition-colors flex items-center gap-2 font-bold ${
                    isBlocked ? "text-success" : "text-error/85"
                  }`}
                >
                  <Ban className="w-3.5 h-3.5" />
                  {isBlocked ? "Unblock Contact" : "Block Contact"}
                </button>

                {/* Clear Chat Option */}
                <div className="border-t border-base-300 my-1"></div>
                <button
                  onClick={() => {
                    onClearChat();
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-base-300 transition-colors flex items-center gap-2 text-error font-bold"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear Chat
                </button>
              </div>
            )}
          </div>

          {/* Close button - Desktop only */}
          <button onClick={() => setSelectedUser(null)} className="hidden md:flex btn btn-ghost btn-circle btn-sm">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
