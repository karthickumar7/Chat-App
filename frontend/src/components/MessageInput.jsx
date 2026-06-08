import { useRef, useState, useEffect } from "react";
import { useChatStore } from "../pages/useChatStore";
import { useAuthStore } from "../pages/useAuthStore";
import { Image, Send, X, Smile, Paperclip, Mic, FileText } from "lucide-react";
import toast from "react-hot-toast";

const popularEmojis = [
  "😊", "😂", "🤣", "❤️", "👍", "🔥", "😍", "😭", 
  "😘", "🥰", "🙌", "👏", "🎉", "✨", "🤔", "👀",
  "😎", "🥺", "💯", "💀", "💩", "😮", "🙏", "❌"
];

const MessageInput = ({ disappearingTime }) => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [fileName, setFileName] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const fileInputRef = useRef(null);
  const docInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [isTypingLocal, setIsTypingLocal] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);

  const { sendMessage, selectedUser, replyingToMessage, setReplyingToMessage } = useChatStore();
  const { socket, authUser } = useAuthStore();

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    };
  }, []);

  const handleTextChange = (e) => {
    const value = e.target.value;
    setText(value);

    if (socket && selectedUser) {
      if (!isTypingLocal) {
        setIsTypingLocal(true);
        socket.emit("typing", { receiverId: selectedUser._id });
      }

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stopTyping", { receiverId: selectedUser._id });
        setIsTypingLocal(false);
      }, 1500);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDocChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be under 10MB");
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFilePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeDoc = () => {
    setFilePreview(null);
    setFileName("");
    if (docInputRef.current) docInputRef.current.value = "";
  };

  const handleEmojiClick = (emoji) => {
    setText((prev) => prev + emoji);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result;
          await sendMessage({
            audio: base64Audio,
            expiresIn: disappearingTime
          });
        };
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Mic access failed:", err);
      toast.error("Microphone access is required to record voice messages");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview && !filePreview) return;

    if (socket && selectedUser && isTypingLocal) {
      socket.emit("stopTyping", { receiverId: selectedUser._id });
      setIsTypingLocal(false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }

    try {
      await sendMessage({
        text: text.trim(),
        image: imagePreview,
        file: filePreview,
        fileName: fileName,
        expiresIn: disappearingTime
      });

      setText("");
      setImagePreview(null);
      setFilePreview(null);
      setFileName("");
      setShowEmojiPicker(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (docInputRef.current) docInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  if (!selectedUser) return null;

  return (
    <div className="p-4 w-full">
      {/* Replying Quote Preview Banner */}
      {replyingToMessage && (
        <div className="mb-2 p-2 bg-base-200 border-l-4 border-primary rounded flex items-center justify-between animate-in slide-in-from-bottom-2 duration-150 text-xs shadow-sm">
          <div className="min-w-0 flex-1 pr-2">
            <span className="font-semibold text-primary block">
              Replying to {replyingToMessage.senderId === authUser?._id ? "yourself" : replyingToMessage.senderId?.fullName || selectedUser.fullName}
            </span>
            <p className="truncate opacity-75 mt-0.5 text-[11px]">
              {replyingToMessage.text || (replyingToMessage.image ? "📷 Photo" : replyingToMessage.file ? "📄 Document" : replyingToMessage.audio ? "🎵 Voice Note" : "")}
            </p>
          </div>
          <button 
            onClick={() => setReplyingToMessage(null)}
            className="btn btn-ghost btn-circle btn-xs text-base-content/60 hover:text-base-content"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-base-300"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300 flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      {filePreview && (
        <div className="mb-3 flex items-center gap-2 animate-in slide-in-from-bottom-2 duration-200">
          <div className="relative flex items-center gap-2.5 bg-base-200 border border-base-300 rounded-lg p-3 max-w-xs shadow-sm">
            <FileText className="w-8 h-8 text-primary" />
            <div className="text-xs truncate max-w-[170px] font-medium text-base-content/90">{fileName}</div>
            <button
              onClick={removeDoc}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300 flex items-center justify-center hover:bg-base-400"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2 relative">
          {/* Emoji Picker Popover */}
          {showEmojiPicker && (
            <div className="absolute bottom-16 left-0 z-50 bg-base-200 border border-base-300 rounded-lg shadow-xl p-3 w-56">
              <div className="grid grid-cols-6 gap-2">
                {popularEmojis.map((emoji, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleEmojiClick(emoji)}
                    className="hover:bg-base-300 p-1 rounded transition-colors text-lg flex items-center justify-center"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!isRecording && (
            <button
              type="button"
              className={`btn btn-circle btn-sm sm:btn-md ${
                showEmojiPicker ? "text-primary bg-base-200" : "text-zinc-400"
              }`}
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Smile className="w-5 h-5" />
            </button>
          )}

          {isRecording ? (
            <div className="flex-1 flex items-center justify-between bg-base-200 border border-base-300 rounded-lg px-3 py-1.5 h-10 sm:h-12 animate-pulse">
              <div className="flex items-center gap-2 text-error">
                <div className="w-2 h-2 rounded-full bg-error animate-ping" />
                <span className="text-xs font-semibold">Recording ({formatTime(recordingTime)})</span>
              </div>
              <button 
                type="button" 
                onClick={stopRecording} 
                className="btn btn-xs btn-error btn-outline rounded-md"
              >
                Send Voice
              </button>
            </div>
          ) : (
            <input
              type="text"
              className="input input-bordered rounded-lg input-sm sm:input-md flex-1 focus:outline-none"
              placeholder="Type a message..."
              value={text}
              onChange={handleTextChange}
            />
          )}

          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />

          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            className="hidden"
            ref={docInputRef}
            onChange={handleDocChange}
          />

          {!isRecording && (
            <>
              <button
                type="button"
                className={`btn btn-circle btn-sm sm:btn-md ${
                  imagePreview ? "text-emerald-500 bg-base-200" : "text-zinc-400"
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <Image className="w-5 h-5" />
              </button>

              <button
                type="button"
                className={`btn btn-circle btn-sm sm:btn-md ${
                  filePreview ? "text-primary bg-base-200" : "text-zinc-400"
                }`}
                onClick={() => docInputRef.current?.click()}
              >
                <Paperclip className="w-5 h-5" />
              </button>

              <button
                type="button"
                className="btn btn-circle btn-sm sm:btn-md text-zinc-400 hover:text-red-500 transition-colors"
                onClick={startRecording}
              >
                <Mic className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
        <button
          type="submit"
          className="btn btn-sm sm:btn-md btn-circle btn-primary"
          disabled={(!text.trim() && !imagePreview && !filePreview) || isRecording}
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
