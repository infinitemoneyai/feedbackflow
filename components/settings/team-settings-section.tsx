"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import {
  Users,
  Crown,
  Shield,
  User,
  Mail,
  Loader2,
  Check,
  X,
  Trash2,
  UserPlus,
  LogOut,
  AlertTriangle,
  Clock,
  Settings,
  Pencil,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface TeamSettingsSectionProps {
  teamId: Id<"teams">;
}

export function TeamSettingsSection({ teamId }: TeamSettingsSectionProps) {
  const team = useQuery(api.teams.getTeam, { teamId });
  const members = useQuery(api.teams.getTeamMembers, { teamId });
  const invites = useQuery(api.teams.getTeamInvites, { teamId });

  const updateTeamMutation = useMutation(api.teams.updateTeam);
  const inviteToTeamMutation = useMutation(api.teams.inviteToTeam);
  const updateMemberRoleMutation = useMutation(api.teams.updateMemberRole);
  const removeMemberMutation = useMutation(api.teams.removeMember);
  const cancelInviteMutation = useMutation(api.teams.cancelInvite);
  const deleteTeamMutation = useMutation(api.teams.deleteTeam);

  // Form state
  const [isEditingTeam, setIsEditingTeam] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // UI state
  const [isSavingTeam, setIsSavingTeam] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [changingRoleFor, setChangingRoleFor] = useState<Id<"users"> | null>(null);
  const [removingMember, setRemovingMember] = useState<Id<"users"> | null>(null);
  const [cancellingInvite, setCancellingInvite] = useState<Id<"teamInvites"> | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const showMessage = useCallback((msg: string, isError = false) => {
    if (isError) {
      setError(msg);
      setTimeout(() => setError(null), 5000);
    } else {
      setSuccess(msg);
      setTimeout(() => setSuccess(null), 3000);
    }
  }, []);

  const handleEditTeam = useCallback(() => {
    if (team) {
      setTeamName(team.name);
      setIsEditingTeam(true);
    }
  }, [team]);

  const handleSaveTeam = useCallback(async () => {
    if (!teamName.trim()) {
      showMessage("Team name is required", true);
      return;
    }

    setIsSavingTeam(true);
    try {
      await updateTeamMutation({ teamId, name: teamName.trim() });
      setIsEditingTeam(false);
      showMessage("Team updated successfully");
    } catch (err) {
      showMessage(err instanceof Error ? err.message : "Failed to update team", true);
    } finally {
      setIsSavingTeam(false);
    }
  }, [teamId, teamName, updateTeamMutation, showMessage]);

  const handleInvite = useCallback(async () => {
    if (!inviteEmail.trim()) {
      showMessage("Email is required", true);
      return;
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) {
      showMessage("Please enter a valid email address", true);
      return;
    }

    setIsInviting(true);
    try {
      await inviteToTeamMutation({ teamId, email: inviteEmail.trim(), role: inviteRole });
      setInviteEmail("");
      setShowInviteForm(false);
      showMessage(`Invitation sent to ${inviteEmail}`);
    } catch (err) {
      showMessage(err instanceof Error ? err.message : "Failed to send invitation", true);
    } finally {
      setIsInviting(false);
    }
  }, [teamId, inviteEmail, inviteRole, inviteToTeamMutation, showMessage]);

  const handleChangeRole = useCallback(
    async (userId: Id<"users">, newRole: "admin" | "member") => {
      setChangingRoleFor(userId);
      try {
        await updateMemberRoleMutation({ teamId, userId, role: newRole });
        showMessage("Role updated successfully");
      } catch (err) {
        showMessage(err instanceof Error ? err.message : "Failed to update role", true);
      } finally {
        setChangingRoleFor(null);
      }
    },
    [teamId, updateMemberRoleMutation, showMessage]
  );

  const handleRemoveMember = useCallback(
    async (userId: Id<"users">, memberName?: string) => {
      if (!confirm(`Are you sure you want to remove ${memberName || "this member"} from the team?`)) {
        return;
      }

      setRemovingMember(userId);
      try {
        await removeMemberMutation({ teamId, userId });
        showMessage("Member removed successfully");
      } catch (err) {
        showMessage(err instanceof Error ? err.message : "Failed to remove member", true);
      } finally {
        setRemovingMember(null);
      }
    },
    [teamId, removeMemberMutation, showMessage]
  );

  const handleLeaveTeam = useCallback(async () => {
    if (!confirm("Are you sure you want to leave this team?")) {
      return;
    }

    const currentMember = members?.find((m: { _id: Id<"users"> }) => m._id === team?.owner?._id);
    if (!currentMember) return;

    setIsLeaving(true);
    try {
      // Find current user's ID from members list
      const currentUserMember = members?.find(
        (m: { role: string; isOwner: boolean }) => !m.isOwner && m.role !== "admin"
      );
      if (currentUserMember) {
        await removeMemberMutation({ teamId, userId: currentUserMember._id });
        showMessage("You have left the team");
        // Redirect would happen via parent component or routing
      }
    } catch (err) {
      showMessage(err instanceof Error ? err.message : "Failed to leave team", true);
    } finally {
      setIsLeaving(false);
    }
  }, [teamId, members, team, removeMemberMutation, showMessage]);

  const handleCancelInvite = useCallback(
    async (inviteId: Id<"teamInvites">) => {
      setCancellingInvite(inviteId);
      try {
        await cancelInviteMutation({ inviteId });
        showMessage("Invitation cancelled");
      } catch (err) {
        showMessage(err instanceof Error ? err.message : "Failed to cancel invitation", true);
      } finally {
        setCancellingInvite(null);
      }
    },
    [cancelInviteMutation, showMessage]
  );

  const handleDeleteTeam = useCallback(async () => {
    if (deleteConfirmText !== team?.name) {
      showMessage("Please type the team name to confirm deletion", true);
      return;
    }

    setIsDeleting(true);
    try {
      await deleteTeamMutation({ teamId });
      showMessage("Team deleted successfully");
      // Redirect would happen via parent component or routing
    } catch (err) {
      showMessage(err instanceof Error ? err.message : "Failed to delete team", true);
    } finally {
      setIsDeleting(false);
    }
  }, [teamId, team?.name, deleteConfirmText, deleteTeamMutation, showMessage]);

  if (!team || !members) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
      </div>
    );
  }

  const isAdmin = team.currentUserRole === "admin";
  const isOwner = team.isOwner;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded border-2 border-retro-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 border-retro-lavender bg-retro-lavender/10">
            <Users className="h-6 w-6 text-retro-lavender" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-retro-black">
              Team Settings
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              Manage team members, roles, and settings.
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

      {/* Team Info */}
      <div className="rounded border-2 border-retro-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-retro-black">Team Information</h3>
          {isAdmin && !isEditingTeam && (
            <button
              onClick={handleEditTeam}
              className="flex items-center gap-1 text-sm text-retro-blue hover:underline"
            >
              <Pencil className="h-3 w-3" />
              Edit
            </button>
          )}
        </div>

        {isEditingTeam ? (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700">
                Team Name
              </label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full rounded border-2 border-stone-200 bg-stone-50 px-4 py-2.5 text-sm transition-colors focus:border-retro-black focus:bg-white focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveTeam}
                disabled={isSavingTeam}
                className="flex items-center gap-2 rounded border-2 border-retro-black bg-retro-black px-4 py-2 text-sm font-medium text-white transition-all hover:translate-x-[1px] hover:translate-y-[1px] disabled:opacity-50"
              >
                {isSavingTeam ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Save
              </button>
              <button
                onClick={() => setIsEditingTeam(false)}
                className="rounded border-2 border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:border-stone-300"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <span className="text-sm text-stone-500">Team Name</span>
              <p className="font-medium text-retro-black">{team.name}</p>
            </div>
            <div>
              <span className="text-sm text-stone-500">Slug</span>
              <p className="font-mono text-sm text-stone-600">{team.slug}</p>
            </div>
            <div>
              <span className="text-sm text-stone-500">Owner</span>
              <p className="flex items-center gap-2 text-stone-600">
                <Crown className="h-4 w-4 text-retro-yellow" />
                {team.owner?.name || team.owner?.email}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Team Members */}
      <div className="rounded border-2 border-retro-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-retro-black">
            Members ({members.length})
          </h3>
          {isAdmin && (
            <button
              onClick={() => setShowInviteForm(!showInviteForm)}
              className="flex items-center gap-2 rounded border-2 border-retro-blue bg-retro-blue/10 px-3 py-1.5 text-sm font-medium text-retro-blue transition-colors hover:bg-retro-blue/20"
            >
              <UserPlus className="h-4 w-4" />
              Invite Member
            </button>
          )}
        </div>

        {/* Invite Form */}
        {showInviteForm && (
          <div className="mb-4 rounded border border-retro-blue/30 bg-retro-blue/5 p-4">
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full rounded border-2 border-stone-200 bg-white px-3 py-2 text-sm focus:border-retro-black focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as "admin" | "member")}
                  className="w-full rounded border-2 border-stone-200 bg-white px-3 py-2 text-sm focus:border-retro-black focus:outline-none"
                >
                  <option value="member">Member - Can view and submit feedback</option>
                  <option value="admin">Admin - Can manage team and settings</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleInvite}
                  disabled={isInviting}
                  className="flex items-center gap-2 rounded border-2 border-retro-black bg-retro-black px-4 py-2 text-sm font-medium text-white transition-all hover:translate-x-[1px] hover:translate-y-[1px] disabled:opacity-50"
                >
                  {isInviting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                  Send Invite
                </button>
                <button
                  onClick={() => setShowInviteForm(false)}
                  className="rounded border-2 border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:border-stone-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Member List */}
        <div className="space-y-2">
          {members.map((member: {
            _id: Id<"users">;
            name?: string;
            email: string;
            role: "admin" | "member";
            isOwner: boolean;
            joinedAt: number;
          }) => (
            <div
              key={member._id}
              className="flex items-center justify-between rounded border border-stone-200 p-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100">
                  {member.isOwner ? (
                    <Crown className="h-5 w-5 text-retro-yellow" />
                  ) : member.role === "admin" ? (
                    <Shield className="h-5 w-5 text-retro-blue" />
                  ) : (
                    <User className="h-5 w-5 text-stone-400" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-retro-black">
                    {member.name || member.email}
                  </p>
                  <p className="text-xs text-stone-500">
                    {member.name && member.email}
                    {member.isOwner && (
                      <span className="ml-2 rounded bg-retro-yellow/20 px-1.5 py-0.5 text-retro-yellow">
                        Owner
                      </span>
                    )}
                    {!member.isOwner && (
                      <span className={`ml-2 rounded px-1.5 py-0.5 ${
                        member.role === "admin"
                          ? "bg-retro-blue/20 text-retro-blue"
                          : "bg-stone-100 text-stone-500"
                      }`}>
                        {member.role === "admin" ? "Admin" : "Member"}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {isAdmin && !member.isOwner && (
                <div className="flex items-center gap-2">
                  {/* Role Dropdown */}
                  <select
                    value={member.role}
                    onChange={(e) =>
                      handleChangeRole(member._id, e.target.value as "admin" | "member")
                    }
                    disabled={changingRoleFor === member._id}
                    className="rounded border border-stone-200 bg-white px-2 py-1 text-sm focus:outline-none disabled:opacity-50"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveMember(member._id, member.name || member.email)}
                    disabled={removingMember === member._id}
                    className="rounded p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  >
                    {removingMember === member._id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Pending Invites */}
      {isAdmin && invites && invites.length > 0 && (
        <div className="rounded border-2 border-retro-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
          <h3 className="mb-4 font-semibold text-retro-black">
            Pending Invites ({invites.length})
          </h3>
          <div className="space-y-2">
            {invites.map((invite: {
              _id: Id<"teamInvites">;
              email: string;
              role: "admin" | "member";
              expiresAt: number;
              inviterName?: string;
            }) => (
              <div
                key={invite._id}
                className="flex items-center justify-between rounded border border-stone-200 p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-50">
                    <Clock className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="font-medium text-retro-black">{invite.email}</p>
                    <p className="text-xs text-stone-500">
                      Invited as {invite.role} by {invite.inviterName}
                      <span className="ml-2 text-yellow-600">
                        Expires {new Date(invite.expiresAt).toLocaleDateString()}
                      </span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleCancelInvite(invite._id)}
                  disabled={cancellingInvite === invite._id}
                  className="rounded px-3 py-1.5 text-sm text-stone-500 hover:bg-stone-100 hover:text-stone-700 disabled:opacity-50"
                >
                  {cancellingInvite === invite._id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Cancel"
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leave Team (for non-owners) */}
      {!isOwner && (
        <div className="rounded border-2 border-stone-200 bg-white p-6">
          <h3 className="mb-2 font-semibold text-stone-700">Leave Team</h3>
          <p className="mb-4 text-sm text-stone-500">
            You will lose access to all team projects and feedback.
          </p>
          <button
            onClick={handleLeaveTeam}
            disabled={isLeaving}
            className="flex items-center gap-2 rounded border-2 border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:border-stone-300 hover:bg-stone-50 disabled:opacity-50"
          >
            {isLeaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            Leave Team
          </button>
        </div>
      )}

      {/* Delete Team (owner only) */}
      {isOwner && (
        <div className="rounded border-2 border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-700">Danger Zone</h3>
              <p className="mb-4 text-sm text-red-600">
                Deleting this team will permanently remove all projects, feedback, and settings.
                This action cannot be undone.
              </p>

              {showDeleteConfirm ? (
                <div className="space-y-3">
                  <p className="text-sm text-red-600">
                    Type <strong>{team.name}</strong> to confirm deletion:
                  </p>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder={team.name}
                    className="w-full rounded border-2 border-red-200 bg-white px-3 py-2 text-sm focus:border-red-400 focus:outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDeleteTeam}
                      disabled={isDeleting || deleteConfirmText !== team.name}
                      className="flex items-center gap-2 rounded border-2 border-red-600 bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      Delete Team Permanently
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
                  Delete Team
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
