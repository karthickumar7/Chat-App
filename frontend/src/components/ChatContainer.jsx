import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../pages/useChatStore";
import { useAuthStore } from "../pages/useAuthStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./MessageSkeleton";
import { Trash2, FileText, CornerUpLeft, Star, Forward, Info, Ban, X } from "lucide-react";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

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
    replyingToMessage,
    setReplyingToMessage,
    users,
  } = useChatStore();
  const { authUser, unblockUser } = useAuthStore();
  const messageEndRef = useRef(null);
  
  const [activeImage, setActiveImage] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMessageForReaction, setSelectedMessageForReaction] = useState(null);

  // 15 Features States
  const [disappearingTime, setDisappearingTime] = useState(null);
  const [wallpaper, setWallpaper] = useState(() => {
    return localStorage.getItem("chat_wallpaper") || "bg-base-100";
  });
  const [starredMessages, setStarredMessages] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("chat_starred_messages")) || [];
    } catch {
      return [];
    }
  });
  const [showStarredDrawer, setShowStarredDrawer] = useState(false);
  const [activeMessageToForward, setActiveMessageToForward] = useState(null);
  const [activeMessageInfo, setActiveMessageInfo] = useState(null);

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

  const highlightText = (text, query) => {
    if (!query) return text;
    const regex = new RegExp(`(${escapeRegExp(query)})`, "gi");
    return text.replace(regex, "<mark class='bg-yellow-300 text-black px-0.5 rounded-sm'>$1</mark>");
  };

  const parseMessageContent = (text, query) => {
    let html = highlightText(text, query);
    // Bold: *text*
    html = html.replace(/\*(.*?)\*/g, "<strong>$1</strong>");
    // Italic: _text_
    html = html.replace(/_(.*?)_/g, "<em>$1</em>");
    // Strikethrough: ~text~
    html = html.replace(/~(.*?)~/g, "<del>$1</del>");
    // Inline Code: `text`
    html = html.replace(/`(.*?)`/g, "<code class='bg-base-300 text-primary-content px-1 py-0.5 rounded font-mono text-[11px]'>$1</code>");
    return html;
  };

  const handleClearChat = async () => {
    if (window.confirm("Are you sure you want to clear all messages in this chat? This action cannot be undone.")) {
      await clearChat(selectedUser._id);
    }
  };

  const toggleStarMessage = (messageId) => {
    let updated;
    if (starredMessages.includes(messageId)) {
      updated = starredMessages.filter(id => id !== messageId);
      toast.success("Message unstarred");
    } else {
      updated = [...starredMessages, messageId];
      toast.success("Message starred");
    }
    setStarredMessages(updated);
    localStorage.setItem("chat_starred_messages", JSON.stringify(updated));
  };

  const handleForward = async (contact) => {
    try {
      await axiosInstance.post(`/messages/send/${contact._id}`, {
        text: activeMessageToForward.text,
        image: activeMessageToForward.image,
        file: activeMessageToForward.file,
        fileName: activeMessageToForward.fileName,
        audio: activeMessageToForward.audio,
      });
      toast.success(`Message forwarded to ${contact.fullName}`);
      setActiveMessageToForward(null);
    } catch (err) {
      toast.error("Failed to forward message");
    }
  };

  const isOtherUserTyping = typingUsers[selectedUser._id];
  const isBlocked = authUser?.blockedUsers?.includes(selectedUser._id);

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto bg-base-100">
        <ChatHeader 
          onToggleSearch={() => setShowSearch(!showSearch)} 
          onClearChat={handleClearChat} 
          onToggleStarredDrawer={() => setShowStarredDrawer(!showStarredDrawer)}
          onWallpaperChange={setWallpaper}
          disappearingTime={disappearingTime}
          onDisappearingTimeChange={setDisappearingTime}
        />
        <MessageSkeleton />
        <MessageInput disappearingTime={disappearingTime} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-base-100 h-full relative">
      <ChatHeader 
        onToggleSearch={() => setShowSearch(!showSearch)} 
        onClearChat={handleClearChat} 
        onToggleStarredDrawer={() => setShowStarredDrawer(!showStarredDrawer)}
        onWallpaperChange={(cls) => {
          setWallpaper(cls);
          localStorage.setItem("chat_wallpaper", cls);
        }}
        disappearingTime={disappearingTime}
        onDisappearingTimeChange={setDisappearingTime}
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

      {/* Main Area layout supporting Starred Messages Drawer */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className={`flex-1 overflow-y-auto p-4 space-y-4 transition-all duration-300 ${wallpaper}`}>
          {messages.map((message) => {
            const isMyMessage = message.senderId === authUser._id;
            const isStarred = starredMessages.includes(message._id);

            return (
              <div
                key={message._id}
                id={`msg-${message._id}`}
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

                {/* Chat Bubble Options capsule & bubble body */}
                <div className="relative group max-w-[80%] sm:max-w-[70%]">
                  
                  {/* Reaction Menu Overlay */}
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

                  {/* Outgoing Message Option Actions Capsule */}
                  {isMyMessage && (
                    <div className="absolute -left-32 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 bg-base-200/90 border border-base-300 rounded-full px-2.5 py-1 shadow-md z-10">
                      <button onClick={() => setReplyingToMessage(message)} className="text-zinc-400 hover:text-primary p-0.5 hover:scale-110 transition-transform" title="Reply"><CornerUpLeft className="w-3.5 h-3.5" /></button>
                      <button onClick={() => toggleStarMessage(message._id)} className="text-zinc-400 hover:text-yellow-500 p-0.5 hover:scale-110 transition-transform" title="Star"><Star className={`w-3.5 h-3.5 ${isStarred ? "fill-yellow-500 text-yellow-500" : ""}`} /></button>
                      <button onClick={() => setActiveMessageToForward(message)} className="text-zinc-400 hover:text-primary p-0.5 hover:scale-110 transition-transform" title="Forward"><Forward className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setActiveMessageInfo(message)} className="text-zinc-400 hover:text-primary p-0.5 hover:scale-110 transition-transform" title="Info"><Info className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteMessage(message._id)} className="text-zinc-400 hover:text-error p-0.5 hover:scale-110 transition-transform" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  )}

                  {/* Incoming Message Option Actions Capsule */}
                  {!isMyMessage && (
                    <div className="absolute -right-28 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 bg-base-200/90 border border-base-300 rounded-full px-2.5 py-1 shadow-md z-10">
                      <button onClick={() => setReplyingToMessage(message)} className="text-zinc-400 hover:text-primary p-0.5 hover:scale-110 transition-transform" title="Reply"><CornerUpLeft className="w-3.5 h-3.5" /></button>
                      <button onClick={() => toggleStarMessage(message._id)} className="text-zinc-400 hover:text-yellow-500 p-0.5 hover:scale-110 transition-transform" title="Star"><Star className={`w-3.5 h-3.5 ${isStarred ? "fill-yellow-500 text-yellow-500" : ""}`} /></button>
                      <button onClick={() => setActiveMessageToForward(message)} className="text-zinc-400 hover:text-primary p-0.5 hover:scale-110 transition-transform" title="Forward"><Forward className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setActiveMessageInfo(message)} className="text-zinc-400 hover:text-primary p-0.5 hover:scale-110 transition-transform" title="Info"><Info className="w-3.5 h-3.5" /></button>
                    </div>
                  )}

                  <div 
                    onClick={() => setSelectedMessageForReaction(selectedMessageForReaction === message._id ? null : message._id)}
                    className="chat-bubble flex flex-col gap-1 break-words relative cursor-pointer"
                  >
                    {/* Render Quoted Reply if present */}
                    {message.replyTo && (
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          const element = document.getElementById(`msg-${message.replyTo._id}`);
                          if (element) {
                            element.scrollIntoView({ behavior: "smooth", block: "center" });
                            element.classList.add("bg-primary/20", "transition-all");
                            setTimeout(() => element.classList.remove("bg-primary/20"), 1000);
                          }
                        }}
                        className="mb-1.5 p-2 bg-base-300/60 border-l-4 border-primary rounded text-xs text-base-content/85 cursor-pointer hover:bg-base-300 transition-colors text-left"
                      >
                        <span className="font-semibold block text-[10px] text-primary">
                          {message.replyTo.senderId === authUser?._id ? "You" : selectedUser.fullName}
                        </span>
                        <p className="truncate text-[11px] mt-0.5">
                          {message.replyTo.text || (message.replyTo.image ? "📷 Photo" : message.replyTo.file ? "📄 Document" : message.replyTo.audio ? "🎵 Voice Note" : "")}
                        </p>
                      </div>
                    )}

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
                      <p 
                        className="text-sm pr-4 whitespace-pre-wrap break-words"
                        dangerouslySetInnerHTML={{ __html: parseMessageContent(message.text, searchQuery) }}
                      />
                    )}

                    {/* Timestamp, star, and checkmarks inside bubble */}
                    <div className="flex items-center justify-end gap-1 mt-1 self-end text-[9px] opacity-65 select-none">
                      {isStarred && <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500 mr-0.5" />}
                      {message.expiresAt && <span className="text-[8px] text-error font-semibold mr-0.5">⏱</span>}
                      <span>{formatMessageTime(message.createdAt)}</span>
                      {isMyMessage && (
                        <span className={`font-bold text-[10px] ${message.isRead ? "text-primary" : "text-base-content/40"}`}>
                          {message.isRead ? "✓✓" : "✓"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Reactions Badge */}
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
                <span className="loading loading-dots loading-xs text-primary animate-pulse"></span>
              </div>
            </div>
          )}

          {/* scroll target */}
          <div ref={messageEndRef} />
        </div>

        {/* Starred Messages Sidebar Panel */}
        {showStarredDrawer && (
          <div className="w-80 border-l border-base-300 bg-base-100 flex flex-col h-full animate-in slide-in-from-right duration-200 z-30 shadow-xl">
            <div className="p-4 border-b border-base-300 flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-1.5 text-sm">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /> Starred Messages
              </h3>
              <button 
                onClick={() => setShowStarredDrawer(false)}
                className="btn btn-ghost btn-circle btn-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.filter(msg => starredMessages.includes(msg._id)).length === 0 ? (
                <div className="text-center text-zinc-500 italic py-8 text-xs">No starred messages in this conversation</div>
              ) : (
                messages.filter(msg => starredMessages.includes(msg._id)).map(msg => (
                  <div 
                    key={msg._id}
                    onClick={() => {
                      const element = document.getElementById(`msg-${msg._id}`);
                      if (element) {
                        element.scrollIntoView({ behavior: "smooth", block: "center" });
                        element.classList.add("bg-primary/20", "transition-all");
                        setTimeout(() => element.classList.remove("bg-primary/20"), 1000);
                      }
                    }}
                    className="p-3 bg-base-200 rounded-lg hover:bg-base-300 transition-colors cursor-pointer border border-base-300 text-xs text-left"
                  >
                    <span className="font-bold block text-primary mb-1">
                      {msg.senderId === authUser?._id ? "You" : selectedUser.fullName}
                    </span>
                    <p className="line-clamp-2">{msg.text || (msg.image ? "📷 Photo" : msg.file ? "📄 Document" : msg.audio ? "🎵 Voice Note" : "")}</p>
                    <span className="text-[9px] opacity-65 block mt-1">{formatMessageTime(msg.createdAt)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Block indicators and message input */}
      {isBlocked ? (
        <div className="p-4 border-t border-base-300 bg-base-200/50 flex flex-col items-center justify-center gap-1 text-center">
          <Ban className="w-5 h-5 text-error" />
          <span className="text-xs font-semibold text-base-content/85">You blocked this user</span>
          <button 
            onClick={() => unblockUser(selectedUser._id)}
            className="btn btn-xs btn-primary font-bold text-[10px] mt-1 rounded-lg"
          >
            Unblock Contact
          </button>
        </div>
      ) : (
        <MessageInput disappearingTime={disappearingTime} />
      )}

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

      {/* Forwarding Modal */}
      {activeMessageToForward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-base-100 border border-base-300 w-full max-w-sm rounded-xl shadow-2xl flex flex-col max-h-[70vh]">
            <div className="p-4 border-b border-base-300 flex items-center justify-between">
              <h3 className="font-semibold text-sm">Forward Message</h3>
              <button 
                onClick={() => setActiveMessageToForward(null)}
                className="btn btn-ghost btn-circle btn-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <div className="text-xs text-zinc-500 mb-2">Select a contact to forward this message to:</div>
              {users.map((user) => (
                <button
                  key={user._id}
                  onClick={() => handleForward(user)}
                  className="w-full p-2.5 flex items-center gap-3 hover:bg-base-200 rounded-lg transition-colors text-left"
                >
                  <img 
                    src={user.profilePic || "/avatar.png"} 
                    alt="avatar" 
                    className="w-8 h-8 rounded-full object-cover border"
                  />
                  <div className="text-xs font-semibold flex-1 truncate">{user.fullName}</div>
                  <span className="text-[10px] text-primary hover:underline font-semibold">Send</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Message Info Modal */}
      {activeMessageInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-base-100 border border-base-300 w-full max-w-sm rounded-xl shadow-2xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-base-300 pb-2">
              <h3 className="font-bold text-sm">Message Details</h3>
              <button 
                onClick={() => setActiveMessageInfo(null)}
                className="btn btn-ghost btn-circle btn-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-3 text-xs">
              <div className="flex justify-between border-b border-base-200 pb-1.5">
                <span className="text-zinc-500">Sent Time</span>
                <span className="font-medium">{new Date(activeMessageInfo.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-base-200 pb-1.5">
                <span className="text-zinc-500">Status</span>
                <span className="font-semibold text-primary">{activeMessageInfo.isRead ? "Read by partner" : "Delivered"}</span>
              </div>
              {activeMessageInfo.text && (
                <div className="flex justify-between border-b border-base-200 pb-1.5">
                  <span className="text-zinc-500">Character Count</span>
                  <span className="font-medium">{activeMessageInfo.text.length} chars</span>
                </div>
              )}
              {activeMessageInfo.file && (
                <div className="flex justify-between border-b border-base-200 pb-1.5">
                  <span className="text-zinc-500">Attachment Name</span>
                  <span className="font-medium truncate max-w-[200px]">{activeMessageInfo.fileName || "Document"}</span>
                </div>
              )}
            </div>
            
            <div className="text-[10px] text-zinc-500 italic text-center pt-2">
              Message ID: {activeMessageInfo._id}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatContainer;
