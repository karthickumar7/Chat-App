import { useState } from 'react';
import { useAuthStore } from "./useAuthStore";
import { Camera, Mail, User, Tag, Lock, Loader2 } from "lucide-react";
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile, changePassword } = useAuthStore();
  const [selectedImg, setSelectedImg] = useState(null);

  // Profile fields state
  const [fullName, setFullName] = useState(authUser?.fullName || "");
  const [nickName, setNickName] = useState(authUser?.nickName || "");

  // Password fields state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isChangingPass, setIsChangingPass] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      await updateProfile({ profilePic: base64Image });
    };
  };

  const handleUpdateProfileDetails = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Full Name is required");
      return;
    }
    await updateProfile({
      fullName: fullName.trim(),
      nickName: nickName.trim(),
    });
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error("Both password fields are required");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    setIsChangingPass(true);
    const success = await changePassword(currentPassword, newPassword);
    setIsChangingPass(false);
    if (success) {
      setCurrentPassword("");
      setNewPassword("");
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-10 bg-base-200">
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <div className="bg-base-100 rounded-xl p-6 shadow-lg space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Profile</h1>
            <p className="mt-1 text-sm text-base-content/60">Manage your profile details and settings</p>
          </div>

          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <img
                src={selectedImg || authUser.profilePic || "/avatar.png"}
                alt="Profile"
                className="size-32 rounded-full object-cover border-4 border-base-300"
              />
              <label
                htmlFor="avatar-upload"
                className={`absolute bottom-0 right-0 bg-primary hover:scale-105 p-2 rounded-full cursor-pointer transition-all duration-200 ${
                  isUpdatingProfile ? "animate-pulse pointer-events-none" : ""
                }`}
              >
                <Camera className="w-5 h-5 text-primary-content" />
                <input
                  type="file"
                  id="avatar-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUpdatingProfile}
                />
              </label>
            </div>
            <p className="text-xs text-base-content/50">
              {isUpdatingProfile ? "Uploading..." : "Click the camera icon to update your avatar"}
            </p>
          </div>

          {/* Profile Details Form */}
          <form onSubmit={handleUpdateProfileDetails} className="space-y-4">
            <div className="form-control">
              <label className="label text-sm font-semibold flex gap-2">
                <User className="w-4 h-4 text-primary" /> Full Name
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="form-control">
              <label className="label text-sm font-semibold flex gap-2">
                <Tag className="w-4 h-4 text-primary" /> Nickname
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={nickName}
                onChange={(e) => setNickName(e.target.value)}
                placeholder="Johnny"
              />
            </div>

            <div className="form-control">
              <label className="label text-sm font-semibold flex gap-2">
                <Mail className="w-4 h-4 text-base-content/40" /> Email Address
              </label>
              <input
                type="email"
                className="input input-bordered w-full bg-base-200 cursor-not-allowed"
                value={authUser?.email}
                disabled
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={isUpdatingProfile}
            >
              {isUpdatingProfile ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Saving Changes...
                </>
              ) : (
                "Save Profile Details"
              )}
            </button>
          </form>
        </div>

        {/* Change Password Block */}
        <div className="bg-base-100 rounded-xl p-6 shadow-lg space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" /> Security - Change Password
          </h2>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="form-control">
              <label className="label text-sm font-semibold">Current Password</label>
              <input
                type="password"
                className="input input-bordered w-full"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <div className="form-control">
              <label className="label text-sm font-semibold">New Password</label>
              <input
                type="password"
                className="input input-bordered w-full"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-secondary w-full"
              disabled={isChangingPass}
            >
              {isChangingPass ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Changing Password...
                </>
              ) : (
                "Change Password"
              )}
            </button>
          </form>
        </div>

        {/* Account Info */}
        <div className="bg-base-100 rounded-xl p-6 shadow-lg">
          <h2 className="text-lg font-semibold mb-4">Account Information</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-base-300">
              <span>Member Since</span>
              <span className="font-semibold">{authUser.createdAt?.split("T")[0]}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span>Account Status</span>
              <span className="text-success font-semibold">Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;