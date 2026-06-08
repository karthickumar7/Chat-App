import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../pages/useAuthStore";
import { Phone, PhoneOff, Mic, MicOff } from "lucide-react";
import toast from "react-hot-toast";

const peerConnectionConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" }
  ]
};

const CallOverlay = () => {
  const {
    activeCall,
    callStatus,
    isIncoming,
    isCaller,
    callPartner,
    offer,
    answer,
    incomingIceCandidate,
    acceptIncomingCall,
    rejectIncomingCall,
    hangupCall,
    socket,
  } = useAuthStore();

  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);

  // Timer for connected call duration
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

  // Clean up streams and peer connections on hangup / unmount
  const cleanupCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.pause();
      remoteAudioRef.current = null;
    }
  };

  useEffect(() => {
    if (!activeCall) {
      cleanupCall();
    }
  }, [activeCall]);

  // Handle incoming ICE candidates
  useEffect(() => {
    if (incomingIceCandidate && pcRef.current) {
      pcRef.current.addIceCandidate(new RTCIceCandidate(incomingIceCandidate))
        .catch((e) => console.error("Error adding ice candidate:", e));
    }
  }, [incomingIceCandidate]);

  // Handle WebRTC connection setup for the Caller
  const initiateWebRTCCall = async () => {
    try {
      cleanupCall();

      // 1. Capture microphone audio stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      // 2. Create peer connection
      const pc = new RTCPeerConnection(peerConnectionConfig);
      pcRef.current = pc;

      // 3. Attach local tracks
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // 4. Handle outbound ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit("iceCandidate", { to: callPartner._id, candidate: event.candidate });
        }
      };

      // 5. Play inbound remote track
      pc.ontrack = (event) => {
        if (!remoteAudioRef.current) {
          const audio = new Audio();
          audio.srcObject = event.streams[0];
          audio.autoplay = true;
          remoteAudioRef.current = audio;
        }
      };

      // 6. Create WebRTC SDP Offer
      const callOffer = await pc.createOffer();
      await pc.setLocalDescription(callOffer);

      // 7. Update store (emits callUser with offer)
      useAuthStore.getState().startCall(callPartner, callOffer);

    } catch (err) {
      console.error("WebRTC caller error:", err);
      toast.error("Failed to capture microphone stream");
      hangupCall();
    }
  };

  // Handle setting the remote answer description on Caller's side
  useEffect(() => {
    const handleSetAnswer = async () => {
      if (callStatus === "connected" && answer && pcRef.current) {
        if (pcRef.current.signalingState === "have-local-offer") {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        }
      }
    };
    handleSetAnswer();
  }, [callStatus, answer]);

  // Handle WebRTC connection setup for the Receiver (upon clicking Accept)
  const handleAcceptCall = async () => {
    try {
      // 1. Capture microphone audio stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      // 2. Create peer connection
      const pc = new RTCPeerConnection(peerConnectionConfig);
      pcRef.current = pc;

      // 3. Attach local tracks
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // 4. Handle outbound ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit("iceCandidate", { to: callPartner._id, candidate: event.candidate });
        }
      };

      // 5. Play inbound remote track
      pc.ontrack = (event) => {
        if (!remoteAudioRef.current) {
          const audio = new Audio();
          audio.srcObject = event.streams[0];
          audio.autoplay = true;
          remoteAudioRef.current = audio;
        }
      };

      // 6. Set remote description (caller's offer)
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      // 7. Create WebRTC SDP Answer
      const callAnswer = await pc.createAnswer();
      await pc.setLocalDescription(callAnswer);

      // 8. Accept call (emits acceptCall with answer)
      acceptIncomingCall(callAnswer);

    } catch (err) {
      console.error("WebRTC receiver error:", err);
      toast.error("Failed to accept call");
      rejectIncomingCall();
    }
  };

  // Toggle local mute
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted; // Toggle enabled status
        setIsMuted(!isMuted);
      }
    }
  };

  // Start call signaling if Caller opens the dialer overlay
  useEffect(() => {
    if (activeCall && isCaller && callStatus === "calling" && !pcRef.current) {
      initiateWebRTCCall();
    }
  }, [activeCall, isCaller, callStatus]);

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
          WebRTC Voice Call
        </span>
        <h2 className="text-3xl font-bold tracking-tight">
          {callPartner.fullName}
        </h2>
        <p className="text-sm text-zinc-400 font-medium font-mono">
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
              onClick={handleAcceptCall}
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
              onClick={toggleMute}
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
