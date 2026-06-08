import { X, Phone } from "lucide-react";
import { useAuthStore } from "../pages/useAuthStore";
import { useChatStore } from "../pages/useChatStore";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers, startCall } = useAuthStore();

  const isOnline = onlineUsers.includes(selectedUser._id);

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="avatar">
            <div className="size-10 rounded-full relative">
              <img src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.fullName} />
            </div>
          </div>

          {/* User info */}
          <div>
            <h3 className="font-medium flex items-center gap-1.5">
              {selectedUser.fullName}
              {selectedUser.nickName && (
                <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full font-normal">
                  {selectedUser.nickName}
                </span>
              )}
            </h3>
            <p className="text-xs text-base-content/70">
              {isOnline ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Voice Call Button */}
          {isOnline && (
            <button 
              onClick={() => startCall(selectedUser)} 
              className="btn btn-ghost btn-circle btn-sm text-primary hover:bg-primary/10"
              title="Start Voice Call"
            >
              <Phone className="w-5 h-5" />
            </button>
          )}

          {/* Close button */}
          <button onClick={() => setSelectedUser(null)} className="btn btn-ghost btn-circle btn-sm">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
export default ChatHeader;
