"use client";

import { useState, useCallback, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import {
  User,
  Camera,
  Loader2,
  Check,
  X,
  Pencil,
  Key,
  Shield,
  AlertTriangle,
  Trash2,
  ExternalLink,
  Link,
} from "lucide-react";
import { api } from "@/convex/_generated/api";

export function UserProfileSection() {
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const currentUser = useQuery(api.users.getCurrentUser);
  const updateProfile = useMutation(api.users.updateProfile);
  const deleteUser = useMutation(api.users.deleteUser);

  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Initialize form state from current user
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || "");
      setAvatarUrl(currentUser.avatar || "");
    }
  }, [currentUser]);

  const showMessage = useCallback((msg: string, isError = false) => {
    if (isError) {
      setError(msg);
      setTimeout(() => setError(null), 5000);
    } else {
      setSuccess(msg);
      setTimeout(() => setSuccess(null), 3000);
    }
  }, []);

  const handleStartEditing = useCallback(() => {
    if (currentUser) {
      setName(currentUser.name || "");
      setAvatarUrl(currentUser.avatar || "");
      setIsEditing(true);
    }
  }, [currentUser]);

  const handleSaveProfile = useCallback(async () => {
    setIsSaving(true);
    setError(null);

    try {
      await updateProfile({
        name: name.trim() || undefined,
        avatar: avatarUrl.trim() || undefined,
      });
      setIsEditing(false);
      showMessage("Profile updated successfully");
    } catch (err) {
      showMessage(err instanceof Error ? err.message : "Failed to update profile", true);
    } finally {
      setIsSaving(false);
    }
  }, [name, avatarUrl, updateProfile, showMessage]);

  const handleCancelEditing = useCallback(() => {
    setIsEditing(false);
    if (currentUser) {
      setName(currentUser.name || "");
      setAvatarUrl(currentUser.avatar || "");
    }
    setError(null);
  }, [currentUser]);

  const handleOpenClerkProfile = useCallback(() => {
    openUserProfile();
  }, [openUserProfile]);

  const handleDeleteAccount = useCallback(async () => {
    if (deleteConfirmText !== "DELETE") {
      showMessage("Please type DELETE to confirm", true);
      return;
    }

    setIsDeleting(true);
    try {
      // Delete user from Convex
      await deleteUser();

      // Sign out from Clerk
      await signOut();

      // Redirect to home
      window.location.href = "/";
    } catch (err) {
      showMessage(err instanceof Error ? err.message : "Failed to delete account", true);
      setIsDeleting(false);
    }
  }, [deleteConfirmText, deleteUser, signOut, showMessage]);

  if (!isClerkLoaded || currentUser === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
      </div>
    );
  }

  if (!clerkUser || !currentUser) {
    return (
      <div className="rounded border-2 border-stone-200 bg-white p-8 text-center">
        <p className="text-stone-600">Unable to load profile</p>
      </div>
    );
  }

  // Get connected accounts from Clerk
  const connectedAccounts = clerkUser.externalAccounts || [];
  const primaryEmail = clerkUser.primaryEmailAddress?.emailAddress || currentUser.email;
  const hasPasswordAuth = clerkUser.passwordEnabled;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded border-2 border-retro-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 border-retro-blue bg-retro-blue/10">
            <User className="h-6 w-6 text-retro-blue" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-retro-black">
              Profile Settings
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              Manage your personal account settings, connected accounts, and preferences.
            </p>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="flex items-center gap-2 rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <Check className="h-4 w-4" />
          {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <X className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Profile Information */}
      <div className="rounded border-2 border-retro-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-retro-black">Profile Information</h3>
          {!isEditing && (
            <button
              onClick={handleStartEditing}
              className="flex items-center gap-1 text-sm text-retro-blue hover:underline"
            >
              <Pencil className="h-3 w-3" />
              Edit
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-6">
            {/* Avatar Section */}
            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700">
                Profile Picture
              </label>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-stone-200 bg-stone-100">
                    {(avatarUrl || currentUser.avatar) ? (
                      <img
                        src={avatarUrl || currentUser.avatar}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <User className="h-8 w-8 text-stone-400" />
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 rounded-full border-2 border-white bg-stone-100 p-1">
                    <Camera className="h-3 w-3 text-stone-500" />
                  </div>
                </div>
                <div className="flex-1">
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full rounded border-2 border-stone-200 bg-stone-50 px-4 py-2.5 text-sm transition-colors focus:border-retro-black focus:bg-white focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-stone-500">
                    Enter an image URL for your profile picture
                  </p>
                </div>
              </div>
            </div>

            {/* Name Field */}
            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700">
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded border-2 border-stone-200 bg-stone-50 px-4 py-2.5 text-sm transition-colors focus:border-retro-black focus:bg-white focus:outline-none"
              />
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700">
                Email Address
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={primaryEmail}
                  disabled
                  className="flex-1 rounded border-2 border-stone-200 bg-stone-100 px-4 py-2.5 text-sm text-stone-500"
                />
                <button
                  onClick={handleOpenClerkProfile}
                  className="flex items-center gap-1 rounded border-2 border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-600 hover:border-stone-300 hover:bg-stone-50"
                >
                  <ExternalLink className="h-3 w-3" />
                  Manage
                </button>
              </div>
              <p className="mt-1 text-xs text-stone-500">
                Email changes are managed through your account settings
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="flex items-center gap-2 rounded border-2 border-retro-black bg-retro-black px-6 py-2.5 text-sm font-medium text-white shadow-[4px_4px_0px_0px_#888] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Save Changes
              </button>
              <button
                onClick={handleCancelEditing}
                className="rounded border-2 border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-600 hover:border-stone-300"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Avatar Display */}
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-stone-200 bg-stone-100">
                {(currentUser.avatar || clerkUser.imageUrl) ? (
                  <img
                    src={currentUser.avatar || clerkUser.imageUrl}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <User className="h-6 w-6 text-stone-400" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-lg font-medium text-retro-black">
                  {currentUser.name || "No name set"}
                </p>
                <p className="text-sm text-stone-500">{primaryEmail}</p>
              </div>
            </div>

            {/* Profile Details */}
            <div className="grid gap-4 pt-4 sm:grid-cols-2">
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-stone-400">
                  Display Name
                </span>
                <p className="mt-1 text-sm text-stone-700">
                  {currentUser.name || <span className="text-stone-400 italic">Not set</span>}
                </p>
              </div>
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-stone-400">
                  Email
                </span>
                <p className="mt-1 text-sm text-stone-700">{primaryEmail}</p>
              </div>
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-stone-400">
                  Member Since
                </span>
                <p className="mt-1 text-sm text-stone-700">
                  {new Date(currentUser.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-stone-400">
                  User ID
                </span>
                <p className="mt-1 font-mono text-xs text-stone-500">
                  {currentUser._id}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Security & Authentication */}
      <div className="rounded border-2 border-retro-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="h-5 w-5 text-stone-600" />
          <h3 className="font-semibold text-retro-black">Security & Authentication</h3>
        </div>

        <div className="space-y-4">
          {/* Password */}
          {hasPasswordAuth && (
            <div className="flex items-center justify-between rounded border border-stone-200 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded bg-stone-100">
                  <Key className="h-5 w-5 text-stone-500" />
                </div>
                <div>
                  <p className="font-medium text-retro-black">Password</p>
                  <p className="text-xs text-stone-500">
                    Secure your account with a password
                  </p>
                </div>
              </div>
              <button
                onClick={handleOpenClerkProfile}
                className="flex items-center gap-1 rounded border-2 border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-600 transition-colors hover:border-stone-300 hover:bg-stone-50"
              >
                Change Password
              </button>
            </div>
          )}

          {/* Two-Factor Authentication */}
          <div className="flex items-center justify-between rounded border border-stone-200 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded bg-stone-100">
                <Shield className="h-5 w-5 text-stone-500" />
              </div>
              <div>
                <p className="font-medium text-retro-black">Two-Factor Authentication</p>
                <p className="text-xs text-stone-500">
                  Add an extra layer of security to your account
                </p>
              </div>
            </div>
            <button
              onClick={handleOpenClerkProfile}
              className="flex items-center gap-1 rounded border-2 border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-600 transition-colors hover:border-stone-300 hover:bg-stone-50"
            >
              Configure
            </button>
          </div>
        </div>
      </div>

      {/* Connected Accounts */}
      <div className="rounded border-2 border-retro-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link className="h-5 w-5 text-stone-600" />
            <h3 className="font-semibold text-retro-black">Connected Accounts</h3>
          </div>
          <button
            onClick={handleOpenClerkProfile}
            className="flex items-center gap-1 text-sm text-retro-blue hover:underline"
          >
            Manage
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>

        {connectedAccounts.length > 0 ? (
          <div className="space-y-3">
            {connectedAccounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center gap-3 rounded border border-stone-200 p-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded bg-stone-100">
                  {account.provider === "google" && (
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  )}
                  {account.provider === "github" && (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                  )}
                  {!["google", "github"].includes(account.provider) && (
                    <Link className="h-5 w-5 text-stone-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium capitalize text-retro-black">
                    {account.provider}
                  </p>
                  <p className="text-xs text-stone-500">
                    {account.emailAddress || "Connected"}
                  </p>
                </div>
                <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                  Connected
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded border border-dashed border-stone-200 bg-stone-50 p-6 text-center">
            <Link className="mx-auto mb-2 h-8 w-8 text-stone-300" />
            <p className="text-sm text-stone-500">
              No external accounts connected
            </p>
            <button
              onClick={handleOpenClerkProfile}
              className="mt-3 text-sm text-retro-blue hover:underline"
            >
              Connect an account
            </button>
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="rounded border-2 border-red-200 bg-red-50 p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-700">Danger Zone</h3>
            <p className="mb-4 text-sm text-red-600">
              Permanently delete your account and all associated data. This action
              cannot be undone.
            </p>

            {showDeleteConfirm ? (
              <div className="space-y-3">
                <p className="text-sm text-red-600">
                  Type <strong>DELETE</strong> to confirm account deletion:
                </p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full rounded border-2 border-red-200 bg-white px-3 py-2 text-sm focus:border-red-400 focus:outline-none"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isDeleting || deleteConfirmText !== "DELETE"}
                    className="flex items-center gap-2 rounded border-2 border-red-600 bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Delete Account Permanently
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText("");
                    }}
                    className="rounded border-2 border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:border-stone-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 rounded border-2 border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:border-red-400 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete Account
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
