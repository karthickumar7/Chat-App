import { useEffect, useState } from "react";
import { useChatStore } from "../pages/useChatStore";
import { useAuthStore } from "../pages/useAuthStore";
import { useStoryStore } from "../pages/useStoryStore";
import StoriesViewer from "./StoriesViewer";
import SidebarSkeleton from "./SidebarSkeleton";
import { Users, Search, Pin, PinOff } from "lucide-react";

const Sidebar = () => {
  const { 
    getUsers, 
    users, 
    selectedUser, 
    setSelectedUser, 
    isUsersLoading,
    globalSearchUsers,
    globalSearchUsersList,
    isGlobalUsersLoading,
    typingUsers,
  } = useChatStore();
  const { onlineUsers, authUser } = useAuthStore();
  const { getStories, stories, uploadStory } = useStoryStore();
  
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [activeStoryUser, setActiveStoryUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [pinnedUsers, setPinnedUsers] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("chat_pinned_users")) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    getUsers();
    getStories();
  }, [getUsers, getStories]);

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const delaySearch = setTimeout(() => {
        globalSearchUsers(searchQuery);
      }, 300);
      return () => clearTimeout(delaySearch);
    }
  }, [searchQuery, globalSearchUsers]);

  const togglePinUser = (userId, e) => {
    e.stopPropagation();
    let updated;
    if (pinnedUsers.includes(userId)) {
      updated = pinnedUsers.filter((id) => id !== userId);
    } else {
      updated = [...pinnedUsers, userId];
    }
    setPinnedUsers(updated);
    localStorage.setItem("chat_pinned_users", JSON.stringify(updated));
  };

  const handleStoryUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      await uploadStory(reader.result);
    };
    reader.readAsDataURL(file);
  };

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

  const filteredUsers = users.filter((user) => {
    const fullName = user.fullName || "";
    const nickName = user.nickName || "";
    const matchesSearch = fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          nickName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesOnline = showOnlineOnly ? onlineUsers.includes(user._id) : true;
    return matchesSearch && matchesOnline;
  });

  // Sort pinned users to the top
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const aPinned = pinnedUsers.includes(a._id);
    const bPinned = pinnedUsers.includes(b._id);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return 0;
  });

  const uniqueStoryUsers = [];
  const seenUsers = new Set();
  
  stories.forEach((story) => {
    if (story.userId && story.userId._id !== authUser?._id) {
      if (!seenUsers.has(story.userId._id)) {
        seenUsers.add(story.userId._id);
        uniqueStoryUsers.push(story);
      }
    }
  });

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-full border-r border-base-300 flex flex-col transition-all duration-200 bg-base-100">
      {/* Header */}
      <div className="border-b border-base-300 p-4 w-full space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            <span className="font-semibold text-lg">Chats</span>
          </div>
          <span className="text-xs text-zinc-500 font-medium">({onlineUsers.length - 1} online)</span>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search contacts..."
            className="input input-bordered input-sm w-full pl-9 rounded-lg bg-base-200/50 focus:outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
        
        {/* Online Filter Toggle */}
        <div className="flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-xs rounded"
            />
            <span className="text-xs font-medium text-base-content/85">Show online only</span>
          </label>
        </div>
      </div>

      {/* Stories Carousel */}
      <div className="p-3 border-b border-base-300 flex gap-3.5 overflow-x-auto scrollbar-none max-w-full bg-base-100">
        {/* My Story Circle */}
        {authUser && (
          <div className="flex flex-col items-center gap-1 min-w-[56px] text-center">
            <div className="relative">
              <img
                src={authUser.profilePic || "/avatar.png"}
                alt="My Profile"
                className="w-11 h-11 rounded-full object-cover border-2 border-base-300"
              />
              <label className="absolute -bottom-1 -right-1 bg-primary w-4.5 h-4.5 rounded-full flex items-center justify-center cursor-pointer text-primary-content text-[11px] font-bold shadow hover:scale-105 transition-transform">
                +
                <input type="file" accept="image/*" className="hidden" onChange={handleStoryUpload} />
              </label>
            </div>
            <span className="text-[9px] font-medium opacity-75 truncate w-12">My Story</span>
          </div>
        )}

        {/* Stories from contacts */}
        {uniqueStoryUsers.map((story) => (
          <button
            key={story._id}
            onClick={() => setActiveStoryUser(story.userId._id)}
            className="flex flex-col items-center gap-1 min-w-[56px] text-center"
          >
            <div className="w-11 h-11 rounded-full p-[2px] bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600">
              <img
                src={story.userId.profilePic || "/avatar.png"}
                alt={story.userId.fullName}
                className="w-full h-full rounded-full object-cover border-2 border-base-100"
              />
            </div>
            <span className="text-[9px] font-medium truncate w-12">
              {story.userId.nickName || story.userId.fullName.split(" ")[0]}
            </span>
          </button>
        ))}
      </div>

      {/* Users List */}
      <div className="overflow-y-auto w-full py-2 flex-1 bg-base-100">
        {/* Local/Sorted Users */}
        {sortedUsers.map((user) => {
          const isOnline = onlineUsers.includes(user._id);
          const isPinned = pinnedUsers.includes(user._id);
          const isUserTyping = typingUsers[user._id];

          return (
            <button
              key={user._id}
              onClick={() => setSelectedUser(user)}
              className={`w-full p-3 flex items-center gap-3 hover:bg-base-200/60 transition-colors group relative ${
                selectedUser?._id === user._id ? "bg-base-200" : ""
              }`}
            >
              <div className="relative shrink-0">
                <img
                  src={user.profilePic || "/avatar.png"}
                  alt={user.fullName}
                  className="size-12 object-cover rounded-full border border-base-300"
                />
                {isOnline ? (
                  <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-base-100" />
                ) : (
                  <span className="absolute bottom-0 right-0 size-3 bg-zinc-400 rounded-full ring-2 ring-base-100" />
                )}
              </div>

              {/* User details */}
              <div className="text-left min-w-0 flex-1 pr-6">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-sm truncate text-base-content/90 flex items-center gap-1.5">
                    {user.fullName}
                    {isPinned && <Pin className="w-3.5 h-3.5 text-primary fill-primary animate-in zoom-in-50 duration-150" />}
                  </div>
                  {isOnline ? (
                    <span className="text-[9px] text-green-500 font-semibold shrink-0">Online</span>
                  ) : (
                    <span className="text-[9px] text-zinc-400 shrink-0 font-medium">
                      {formatLastSeen(user.lastSeen)}
                    </span>
                  )}
                </div>
                {isUserTyping ? (
                  <div className="flex items-center gap-1 text-xs text-green-500 font-semibold animate-pulse mt-0.5">
                    <span>typing</span>
                    <span className="loading loading-dots loading-xs text-green-500 scale-75"></span>
                  </div>
                ) : (
                  <div className="text-xs text-base-content/60 truncate max-w-[170px] mt-0.5">
                    {user.status || "Hey there! I am using Chat App."}
                  </div>
                )}
              </div>

              {/* Pin Action Overlay on Hover */}
              <button
                onClick={(e) => togglePinUser(user._id, e)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full hover:bg-base-300 text-zinc-400 hover:text-primary z-10"
                title={isPinned ? "Unpin Chat" : "Pin Chat"}
              >
                {isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
              </button>
            </button>
          );
        })}

        {/* Global Search Results Section */}
        {searchQuery.trim().length > 0 && (
          <div className="border-t border-base-300 mt-2.5 pt-2.5">
            <div className="text-[10px] font-bold px-4 text-zinc-500 uppercase tracking-wider mb-1">
              Global Database Contacts
            </div>
            {isGlobalUsersLoading ? (
              <div className="px-4 py-2 text-xs text-zinc-400">Searching global network...</div>
            ) : globalSearchUsersList.filter(gu => !users.some(u => u._id === gu._id)).length === 0 ? (
              <div className="px-4 py-2 text-xs text-zinc-500 italic">No external contacts found</div>
            ) : (
              globalSearchUsersList
                .filter(gu => !users.some(u => u._id === gu._id))
                .map((user) => (
                  <button
                    key={user._id}
                    onClick={() => setSelectedUser(user)}
                    className="w-full p-3 flex items-center gap-3 hover:bg-base-200/60 transition-colors"
                  >
                    <div className="relative shrink-0">
                      <img
                        src={user.profilePic || "/avatar.png"}
                        alt={user.fullName}
                        className="size-11 object-cover rounded-full border border-base-300 opacity-80"
                      />
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <div className="font-semibold text-sm truncate text-base-content/95">{user.fullName}</div>
                      <div className="text-[11px] text-primary/75 truncate mt-0.5">{user.email}</div>
                    </div>
                  </button>
                ))
            )}
          </div>
        )}

        {sortedUsers.length === 0 && searchQuery.trim().length === 0 && (
          <div className="text-center text-zinc-500 py-8 text-sm font-medium">
            No contacts found
          </div>
        )}
      </div>

      {activeStoryUser && (
        <StoriesViewer
          stories={stories.filter((s) => s.userId?._id === activeStoryUser)}
          onClose={() => setActiveStoryUser(null)}
        />
      )}
    </aside>
  );
};

export default Sidebar;
