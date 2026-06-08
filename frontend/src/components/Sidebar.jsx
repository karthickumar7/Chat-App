import { useEffect, useState } from "react";
import { useChatStore } from "../pages/useChatStore";
import { useAuthStore } from "../pages/useAuthStore";
import { useStoryStore } from "../pages/useStoryStore";
import StoriesViewer from "./StoriesViewer";
import SidebarSkeleton from "./SidebarSkeleton";
import { Users, Search } from "lucide-react";

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();
  const { onlineUsers, authUser } = useAuthStore();
  const { getStories, stories, uploadStory } = useStoryStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [activeStoryUser, setActiveStoryUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    getUsers();
    getStories();
  }, [getUsers, getStories]);

  const filteredUsers = users.filter((user) => {
    const fullName = user.fullName || "";
    const nickName = user.nickName || "";
    const matchesSearch = fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          nickName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesOnline = showOnlineOnly ? onlineUsers.includes(user._id) : true;
    return matchesSearch && matchesOnline;
  });

  const handleStoryUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      await uploadStory(reader.result);
    };
    reader.readAsDataURL(file);
  };

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
            className="input input-bordered input-sm w-full pl-9 rounded-lg bg-base-200/50"
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
        {filteredUsers.map((user) => {
          const isOnline = onlineUsers.includes(user._id);
          return (
            <button
              key={user._id}
              onClick={() => setSelectedUser(user)}
              className={`w-full p-3 flex items-center gap-3 hover:bg-base-200/60 transition-colors ${
                selectedUser?._id === user._id ? "bg-base-200" : ""
              }`}
            >
              <div className="relative shrink-0">
                <img
                  src={user.profilePic || "/avatar.png"}
                  alt={user.fullName}
                  className="size-12 object-cover rounded-full border border-base-300"
                />
                {isOnline && (
                  <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-base-100" />
                )}
              </div>

              {/* User details */}
              <div className="text-left min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-sm truncate text-base-content/90">{user.fullName}</div>
                  {isOnline && <span className="text-[10px] text-green-500 font-semibold shrink-0">Online</span>}
                </div>
                <div className="text-xs text-base-content/60 truncate max-w-[170px] mt-0.5">
                  {user.status || "Hey there! I am using Chat App."}
                </div>
              </div>
            </button>
          );
        })}

        {filteredUsers.length === 0 && (
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
