import { useEffect, useState } from "react";
import { useChatStore } from "../pages/useChatStore";
import { useAuthStore } from "../pages/useAuthStore";
import { useStoryStore } from "../pages/useStoryStore";
import StoriesViewer from "./StoriesViewer";
import SidebarSkeleton from "./SidebarSkeleton";
import { Users } from "lucide-react";

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();
  const { onlineUsers, authUser } = useAuthStore();
  const { getStories, stories, uploadStory } = useStoryStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [activeStoryUser, setActiveStoryUser] = useState(null);

  useEffect(() => {
    getUsers();
    getStories();
  }, [getUsers, getStories]);

  const filteredUsers = showOnlineOnly
    ? users.filter((user) => onlineUsers.includes(user._id))
    : users;

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
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      {/* Header */}
      <div className="border-b border-base-300 p-5 w-full">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6" />
          <span className="font-medium hidden lg:inline">Contacts</span>
        </div>
        
        {/* Online Filter Toggle - only on large screens */}
        <div className="mt-3 hidden lg:flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <span className="text-xs">Show online only</span>
          </label>
          <span className="text-xs text-zinc-500">({onlineUsers.length - 1} online)</span>
        </div>
      </div>

      {/* Stories Carousel */}
      <div className="p-3 border-b border-base-300 flex gap-3 overflow-x-auto scrollbar-none max-w-full">
        {/* My Story Circle */}
        {authUser && (
          <div className="flex flex-col items-center gap-1 min-w-[56px] text-center">
            <div className="relative">
              <img
                src={authUser.profilePic || "/avatar.png"}
                alt="My Profile"
                className="w-10 h-10 rounded-full object-cover border border-base-300"
              />
              <label className="absolute -bottom-1 -right-1 bg-primary w-4.5 h-4.5 rounded-full flex items-center justify-center cursor-pointer text-primary-content text-[11px] font-bold shadow hover:scale-110 transition-transform">
                +
                <input type="file" accept="image/*" className="hidden" onChange={handleStoryUpload} />
              </label>
            </div>
            <span className="text-[9px] opacity-75 hidden lg:inline truncate w-12">My Story</span>
          </div>
        )}

        {/* Stories from contacts */}
        {uniqueStoryUsers.map((story) => (
          <button
            key={story._id}
            onClick={() => setActiveStoryUser(story.userId._id)}
            className="flex flex-col items-center gap-1 min-w-[56px] text-center"
          >
            <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600">
              <img
                src={story.userId.profilePic || "/avatar.png"}
                alt={story.userId.fullName}
                className="w-full h-full rounded-full object-cover border border-base-100"
              />
            </div>
            <span className="text-[9px] truncate w-12 hidden lg:inline">
              {story.userId.nickName || story.userId.fullName.split(" ")[0]}
            </span>
          </button>
        ))}
      </div>

      {/* Users List */}
      <div className="overflow-y-auto w-full py-3">
        {filteredUsers.map((user) => {
          const isOnline = onlineUsers.includes(user._id);
          return (
            <button
              key={user._id}
              onClick={() => setSelectedUser(user)}
              className={`w-full p-3 flex items-center gap-3 hover:bg-base-300/40 transition-colors ${
                selectedUser?._id === user._id ? "bg-base-300" : ""
              }`}
            >
              <div className="relative mx-auto lg:mx-0">
                <img
                  src={user.profilePic || "/avatar.png"}
                  alt={user.fullName}
                  className="size-12 object-cover rounded-full"
                />
                {isOnline && (
                  <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-zinc-900" />
                )}
              </div>

              {/* User details - large screens only */}
              <div className="hidden lg:block text-left min-w-0">
                <div className="font-medium truncate">{user.fullName}</div>
                <div className="text-xs text-zinc-400 truncate w-44">
                  {user.status || (isOnline ? "Online" : "Offline")}
                </div>
              </div>
            </button>
          );
        })}

        {filteredUsers.length === 0 && (
          <div className="text-center text-zinc-500 py-4 hidden lg:block">
            No contacts online
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
