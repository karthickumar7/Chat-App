import { useEffect, useState } from "react";
import { useAuthStore } from "../pages/useAuthStore";
import { Phone, PhoneOff, Mic, MicOff } from "lucide-react";

const CallOverlay = () => {
  const {
    activeCall,
    callStatus,
    isIncoming,
    callPartner,
    acceptIncomingCall,
    rejectIncomingCall,
    hangupCall,
  } = useAuthStore();

  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    let timer = null;
    if (callStatus === "connected") {
      setCallDuration(0);
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [callStatus]);

  if (!activeCall || !callPartner) return null;

  const formatCallTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-zinc-950/95 text-white p-10 backdrop-blur-md animate-in fade-in duration-300">
      {/* Top Banner Status */}
      <div className="text-center mt-10 space-y-2">
        <span className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">
          Voice Call
        </span>
        <h2 className="text-3xl font-bold tracking-tight">
          {callPartner.fullName}
        </h2>
        <p className="text-sm text-zinc-400 font-medium">
          {callStatus === "calling" && "Calling..."}
          {callStatus === "ringing" && "Incoming call..."}
          {callStatus === "connected" && `Connected (${formatCallTime(callDuration)})`}
        </p>
      </div>

      {/* Avatar Container with Pulsing Rings */}
      <div className="relative flex items-center justify-center my-auto">
        <div className="absolute w-48 h-48 rounded-full border border-primary/20 animate-ping duration-1000 opacity-20" />
        <div className="absolute w-40 h-40 rounded-full border border-primary/30 animate-pulse duration-700 opacity-30" />
        <div className="size-32 rounded-full overflow-hidden border-4 border-primary shadow-2xl relative z-10">
          <img 
            src={callPartner.profilePic || "/avatar.png"} 
            alt="avatar" 
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Bottom Panel Actions */}
      <div className="flex flex-col items-center gap-6 w-full max-w-xs mb-10">
        {callStatus === "ringing" ? (
          /* Incoming Call Actions */
          <div className="flex justify-around items-center w-full">
            {/* Decline Button */}
            <button
              onClick={rejectIncomingCall}
              className="btn btn-circle btn-lg bg-error hover:bg-error/80 border-none text-white hover:scale-105 transition-all shadow-lg"
              title="Decline Call"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
            
            {/* Accept Button */}
            <button
              onClick={acceptIncomingCall}
              className="btn btn-circle btn-lg bg-success hover:bg-success/80 border-none text-white hover:scale-105 transition-all shadow-lg animate-bounce"
              title="Accept Call"
            >
              <Phone className="w-6 h-6" />
            </button>
          </div>
        ) : (
          /* Calling / Connected Call Actions */
          <div className="flex justify-around items-center w-full">
            {/* Mute Button */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`btn btn-circle btn-md border-none text-white transition-all shadow-md ${
                isMuted ? "bg-zinc-700 hover:bg-zinc-600" : "bg-zinc-800 hover:bg-zinc-700"
              }`}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Hang Up Button */}
            <button
              onClick={hangupCall}
              className="btn btn-circle btn-lg bg-error hover:bg-error/80 border-none text-white hover:scale-105 transition-all shadow-lg"
              title="Hang Up"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CallOverlay;
