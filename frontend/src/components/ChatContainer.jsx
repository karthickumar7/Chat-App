import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../pages/useChatStore";
import { useAuthStore } from "../pages/useAuthStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./MessageSkeleton";
import { Trash2 } from "lucide-react";

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
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const [activeImage, setActiveImage] = useState(null);

  useEffect(() => {
    getMessages(selectedUser._id);
    subscribeToMessages();

    return () => {
      unsubscribeFromMessages();
    };
  }, [selectedUser._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, typingUsers]);

  const formatMessageTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isOtherUserTyping = typingUsers[selectedUser._id];

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto bg-base-100">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto bg-base-100">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isMyMessage = message.senderId === authUser._id;
          return (
            <div
              key={message._id}
              className={`chat ${isMyMessage ? "chat-end" : "chat-start"}`}
              ref={messageEndRef}
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

              {/* Timestamp */}
              <div className="chat-header mb-1 text-xs opacity-50 ml-1">
                <time className="text-[10px] ml-1">
                  {formatMessageTime(message.createdAt)}
                </time>
              </div>

              {/* Chat Bubble with delete action */}
              <div className="relative group max-w-[80%] sm:max-w-[70%]">
                {isMyMessage && (
                  <button
                    onClick={() => deleteMessage(message._id)}
                    className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-error hover:scale-110 p-1.5 rounded-full hover:bg-base-200"
                    title="Delete message"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
                <div className="chat-bubble flex flex-col gap-1 break-words">
                  {message.image && (
                    <img
                      src={message.image}
                      alt="attachment"
                      className="sm:max-w-[200px] rounded-md mb-1 object-cover cursor-zoom-in hover:opacity-90 transition-opacity"
                      onClick={() => setActiveImage(message.image)}
                    />
                  )}
                  {message.text && <p>{message.text}</p>}
                </div>
              </div>
            </div>
          );
        })}

        {/* Real-time Typing Status Indicator */}
        {isOtherUserTyping && (
          <div className="chat chat-start" ref={messageEndRef}>
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
