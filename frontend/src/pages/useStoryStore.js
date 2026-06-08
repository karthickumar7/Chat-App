import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

export const useStoryStore = create((set, get) => ({
  stories: [],
  isStoriesLoading: false,
  isUploadingStory: false,

  getStories: async () => {
    set({ isStoriesLoading: true });
    try {
      const res = await axiosInstance.get("/stories/all");
      set({ stories: res.data.stories });
    } catch (error) {
      console.error("Failed to load stories:", error);
    } finally {
      set({ isStoriesLoading: false });
    }
  },

  uploadStory: async (base64Media) => {
    set({ isUploadingStory: true });
    try {
      const res = await axiosInstance.post("/stories/create", { media: base64Media });
      set({ stories: [res.data.story, ...get().stories] });
      toast.success("Story posted successfully!");
    } catch (error) {
      toast.error(error.response?.data?.msg || "Failed to post story");
    } finally {
      set({ isUploadingStory: false });
    }
  },
}));
