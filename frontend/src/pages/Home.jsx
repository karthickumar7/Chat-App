import { useChatStore } from "./useChatStore";
import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";

const Home = () => {
  const { selectedUser } = useChatStore();

  return (
    <div className="h-screen bg-base-200">
      <div className="flex items-center justify-center pt-20 px-0 sm:px-4">
        <div className="bg-base-100 sm:rounded-lg shadow-xl w-full max-w-6xl h-[calc(100vh-8rem)]">
          <div className="flex h-full sm:rounded-lg overflow-hidden">
            {/* Sidebar Container */}
            <div className={`h-full ${selectedUser ? "hidden md:block md:w-80 shrink-0" : "w-full md:w-80 shrink-0"}`}>
              <Sidebar />
            </div>

            {/* Chat Container */}
            <div className={`flex-1 h-full ${!selectedUser ? "hidden md:flex" : "flex"}`}>
              {!selectedUser ? <NoChatSelected /> : <ChatContainer />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;