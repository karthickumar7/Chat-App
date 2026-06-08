import { useEffect, useState } from "react";
import { X } from "lucide-react";

const StoriesViewer = ({ stories, initialUserIndex = 0, onClose }) => {
  // Group stories by user so we can swipe through users or just see all stories of the selected user
  // For simplicity and solid execution, we will view the stories of the selected user.
  const userStories = stories; 
  const [currentIndex, setCurrentIndex] = useState(initialUserIndex);
  const [progress, setProgress] = useState(0);

  const activeStory = userStories[currentIndex];

  useEffect(() => {
    // Reset progress when index changes
    setProgress(0);
  }, [currentIndex]);

  useEffect(() => {
    const duration = 5000; // 5 seconds
    const intervalTime = 50; // 50ms ticks
    const increment = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          // Advance to next story if available, else close
          if (currentIndex < userStories.length - 1) {
            setCurrentIndex((prevIdx) => prevIdx + 1);
          } else {
            onClose();
          }
          return 100;
        }
        return prev + increment;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [currentIndex, userStories.length, onClose]);

  if (!activeStory) return null;

  const handleNext = (e) => {
    e.stopPropagation();
    if (currentIndex < userStories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md cursor-pointer"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg h-[90vh] bg-zinc-950 rounded-xl overflow-hidden flex flex-col justify-between p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress Bars */}
        <div className="absolute top-2 left-2 right-2 flex gap-1 z-20">
          {userStories.map((_, idx) => (
            <div key={idx} className="h-1 flex-1 bg-zinc-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all ease-linear" 
                style={{ 
                  width: `${idx === currentIndex ? progress : idx < currentIndex ? 100 : 0}%`,
                  transitionDuration: idx === currentIndex ? "50ms" : "0s"
                }}
              />
            </div>
          ))}
        </div>

        {/* Header (User Profile) */}
        <div className="absolute top-6 left-4 right-4 flex justify-between items-center z-20 bg-gradient-to-b from-black/50 to-transparent p-2 rounded-t-lg">
          <div className="flex items-center gap-3">
            <img 
              src={activeStory.userId?.profilePic || "/avatar.png"} 
              alt="avatar" 
              className="w-10 h-10 rounded-full object-cover border-2 border-primary"
            />
            <div>
              <h4 className="text-white font-semibold text-sm">
                {activeStory.userId?.nickName || activeStory.userId?.fullName}
              </h4>
              <p className="text-white/60 text-xs">
                {new Date(activeStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <button 
            className="text-white/80 hover:text-white bg-black/20 hover:bg-black/40 p-2 rounded-full transition-colors"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation tap areas */}
        <div className="absolute inset-y-0 left-0 w-1/4 z-10" onClick={handlePrev} />
        <div className="absolute inset-y-0 right-0 w-1/4 z-10" onClick={handleNext} />

        {/* Content Image */}
        <div className="flex-1 flex items-center justify-center p-2 mt-10 mb-2">
          <img 
            src={activeStory.mediaUrl} 
            alt="story" 
            className="max-h-[75vh] max-w-full rounded-lg object-contain"
          />
        </div>
      </div>
    </div>
  );
};

export default StoriesViewer;
