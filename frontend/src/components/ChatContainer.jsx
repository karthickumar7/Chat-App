import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../pages/useChatStore";
import { useAuthStore } from "../pages/useAuthStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./MessageSkeleton";
import { Trash2, FileText } from "lucide-react";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    typingUsers,
    deleteMessage,
    addReaction,
    clearChat,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  
  const [activeImage, setActiveImage] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMessageForReaction, setSelectedMessageForReaction] = useState(null);

  useEffect(() => {
    if (!selectedUser) return;
    getMessages(selectedUser._id);
    subscribeToMessages();

    return () => {
      unsubscribeFromMessages();
    };
  }, [selectedUser?._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, typingUsers]);

  if (!selectedUser) return null;

  const formatMessageTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  };

  const renderHighlightedText = (text, query) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="bg-yellow-300 text-black px-0.5 rounded-sm">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const handleClearChat = async () => {
    if (window.confirm("Are you sure you want to clear all messages in this chat? This action cannot be undone.")) {
      await clearChat(selectedUser._id);
    }
  };

  const isOtherUserTyping = typingUsers[selectedUser._id];

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto bg-base-100">
        <ChatHeader 
          onToggleSearch={() => setShowSearch(!showSearch)} 
          onClearChat={handleClearChat} 
        />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto bg-base-100">
      <ChatHeader 
        onToggleSearch={() => setShowSearch(!showSearch)} 
        onClearChat={handleClearChat} 
      />

      {/* Message Search Bar */}
      {showSearch && (
        <div className="px-4 py-2 border-b border-base-300 bg-base-100 flex items-center gap-2 animate-in slide-in-from-top duration-200">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input input-sm input-bordered w-full pr-8 pl-3 text-xs focus:outline-none"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content text-xs"
              >
                ✕
              </button>
            )}
          </div>
          <button 
            onClick={() => {
              setShowSearch(false);
              setSearchQuery("");
            }} 
            className="btn btn-ghost btn-xs text-xs"
          >
            Cancel
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isMyMessage = message.senderId === authUser._id;
          return (
            <div
              key={message._id}
              className={`chat ${isMyMessage ? "chat-end" : "chat-start"}`}
            >
              {/* Avatar */}
              <div className="chat-image avatar">
                <div className="size-10 rounded-full border">
                  <img
                    src={
                      isMyMessage
                        ? authUser.profilePic || "/avatar.png"
                        : selectedUser.profilePic || "/avatar.png"
                    }
                    alt="avatar"
                  />
                </div>
              </div>

              {/* Chat Bubble with reaction menu & delete action */}
              <div className="relative group max-w-[80%] sm:max-w-[70%]">
                
                {/* Reaction Menu Overlay (Visible on Hover for desktop / Click for mobile) */}
                <div className={`absolute -top-9 ${isMyMessage ? "right-0" : "left-0"} ${selectedMessageForReaction === message._id ? "flex" : "hidden group-hover:flex"} items-center gap-1.5 bg-base-200 border border-base-300 rounded-full px-2 py-1 shadow-lg z-20 animate-in fade-in zoom-in-95 duration-100`}>
                  {["❤️", "👍", "😂", "😮", "😢", "🙏"].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={(e) => {
                        e.stopPropagation();
                        addReaction(message._id, emoji);
                        setSelectedMessageForReaction(null);
                      }}
                      className="hover:scale-125 transition-transform text-sm md:text-base p-0.5 active:scale-95"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                {isMyMessage && (
                  <button
                    onClick={() => deleteMessage(message._id)}
                    className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-error hover:scale-110 p-1.5 rounded-full hover:bg-base-200"
                    title="Delete message"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}

                <div 
                  onClick={() => setSelectedMessageForReaction(selectedMessageForReaction === message._id ? null : message._id)}
                  className="chat-bubble flex flex-col gap-1 break-words relative cursor-pointer"
                >
                  {message.image && (
                    <img
                      src={message.image}
                      alt="attachment"
                      className="sm:max-w-[200px] rounded-md mb-1 object-cover cursor-zoom-in hover:opacity-90 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImage(message.image);
                      }}
                    />
                  )}
                  {message.file && (
                    <div className="flex items-center gap-2 bg-base-300 border border-base-300 rounded-lg p-2 my-1 max-w-xs shadow-sm text-base-content">
                      <FileText className="w-8 h-8 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold truncate">{message.fileName || "Document"}</div>
                        <span className="text-[10px] opacity-65">PDF/Document</span>
                      </div>
                      <a 
                        href={message.file} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        onClick={(e) => e.stopPropagation()}
                        className="btn btn-xs btn-primary font-bold text-[10px] shrink-0"
                      >
                        Open
                      </a>
                    </div>
                  )}
                  {message.audio && (
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 my-1 p-1 bg-base-300 rounded-lg max-w-xs"
                    >
                      <audio src={message.audio} controls className="max-w-[200px] h-8 text-xs focus:outline-none" />
                    </div>
                  )}
                  {message.text && (
                    <p className="text-sm pr-4">
                      {renderHighlightedText(message.text, searchQuery)}
                    </p>
                  )}

                  {/* Timestamp & Read Receipts Badge */}
                  <div className="flex items-center justify-end gap-1 mt-1 self-end text-[9px] opacity-65 select-none">
                    <span>{formatMessageTime(message.createdAt)}</span>
                    {isMyMessage && (
                      <span className={`font-bold text-[10px] ${message.isRead ? "text-primary" : "text-base-content/40"}`}>
                        {message.isRead ? "✓✓" : "✓"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Displayed Active Reactions */}
                {message.reactions && message.reactions.length > 0 && (
                  <div className="absolute -bottom-2 right-2 flex items-center gap-0.5 bg-base-200 border border-base-300 rounded-full px-1.5 py-0.5 shadow-sm text-[10px] select-none z-10">
                    {Array.from(new Set(message.reactions.map((r) => r.emoji))).map((emoji, idx) => (
                      <span key={idx}>{emoji}</span>
                    ))}
                    {message.reactions.length > 1 && (
                      <span className="text-[8px] opacity-75 font-semibold ml-0.5">
                        {message.reactions.length}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Real-time Typing Status Indicator */}
        {isOtherUserTyping && (
          <div className="chat chat-start">
            <div className="chat-image avatar">
              <div className="size-10 rounded-full border">
                <img src={selectedUser.profilePic || "/avatar.png"} alt="avatar" />
              </div>
            </div>
            <div className="chat-bubble bg-base-200 text-base-content flex items-center gap-1.5 py-2.5">
              <span className="text-xs opacity-70">
                {selectedUser.nickName || selectedUser.fullName} is typing
              </span>
              <span className="loading loading-dots loading-xs text-primary"></span>
            </div>
          </div>
        )}

        {/* scroll target */}
        <div ref={messageEndRef} />
      </div>

      <MessageInput />

      {/* Image Lightbox Modal */}
      {activeImage && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm cursor-zoom-out p-4"
          onClick={() => setActiveImage(null)}
        >
          <div className="relative max-w-full max-h-[85vh] flex items-center justify-center">
            <img
              src={activeImage}
              alt="Fullscreen preview"
              className="rounded-lg max-w-full max-h-[85vh] object-contain shadow-2xl transition-all"
            />
            <button className="absolute -top-12 right-0 text-white hover:text-primary transition-colors bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full text-xs font-semibold">
              ✕ Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatContainer;
