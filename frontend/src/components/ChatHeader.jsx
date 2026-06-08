import { X, Phone, ArrowLeft, Search, Trash2, MoreVertical } from "lucide-react";
import { useAuthStore } from "../pages/useAuthStore";
import { useChatStore } from "../pages/useChatStore";
import { useState } from "react";

const ChatHeader = ({ onToggleSearch, onClearChat }) => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers, startCall } = useAuthStore();
  const [showDropdown, setShowDropdown] = useState(false);

  const isOnline = selectedUser ? onlineUsers.includes(selectedUser._id) : false;

  if (!selectedUser) return null;

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
              {isOnline ? "Online" : "Offline"}
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

          {/* Voice Call Button */}
          {isOnline && (
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
              <div className="absolute right-0 mt-1.5 w-36 bg-base-200 border border-base-300 rounded-lg shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={() => {
                    onClearChat();
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-error hover:bg-base-300 transition-colors flex items-center gap-2"
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
