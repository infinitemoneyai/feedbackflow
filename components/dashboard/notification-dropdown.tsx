"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import {
  Bell,
  Inbox,
  UserPlus,
  MessageSquare,
  AtSign,
  Send,
  AlertTriangle,
  CheckCheck,
  Bug,
  Lightbulb,
  Loader2,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";

type NotificationType =
  | "new_feedback"
  | "assignment"
  | "comment"
  | "mention"
  | "export_complete"
  | "export_failed";

interface Notification {
  _id: Id<"notifications">;
  userId: Id<"users">;
  type: NotificationType;
  title: string;
  body?: string;
  feedbackId?: Id<"feedback">;
  isRead: boolean;
  createdAt: number;
  feedbackTitle?: string;
  feedbackType?: string;
}

interface NotificationDropdownProps {
  onNotificationClick?: (feedbackId: Id<"feedback"> | undefined) => void;
}

const notificationIcons: Record<NotificationType, React.ReactNode> = {
  new_feedback: <Inbox className="h-4 w-4" />,
  assignment: <UserPlus className="h-4 w-4" />,
  comment: <MessageSquare className="h-4 w-4" />,
  mention: <AtSign className="h-4 w-4" />,
  export_complete: <Send className="h-4 w-4" />,
  export_failed: <AlertTriangle className="h-4 w-4" />,
};

const notificationColors: Record<NotificationType, string> = {
  new_feedback: "bg-retro-blue/10 text-retro-blue border-retro-blue/20",
  assignment: "bg-retro-lavender/20 text-purple-700 border-retro-lavender/30",
  comment: "bg-stone-100 text-stone-600 border-stone-200",
  mention: "bg-retro-yellow/10 text-amber-700 border-retro-yellow/20",
  export_complete: "bg-green-50 text-green-700 border-green-200",
  export_failed: "bg-retro-red/10 text-retro-red border-retro-red/20",
};

export function NotificationDropdown({
  onNotificationClick,
}: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Queries
  const notifications = useQuery(api.notifications.getNotifications, {
    limit: 20,
  }) as Notification[] | undefined;
  const unreadCount = useQuery(api.notifications.getUnreadCount, {});

  // Mutations
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      await markAsRead({ notificationId: notification._id });
    }

    // Navigate to feedback if available
    if (notification.feedbackId && onNotificationClick) {
      onNotificationClick(notification.feedbackId);
    }

    setIsOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead({});
  };

  const formatTime = (timestamp: number) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded p-2 text-stone-600 transition-colors hover:bg-stone-100 hover:text-retro-black"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {/* Unread badge */}
        {unreadCount !== undefined && unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-retro-red opacity-75" />
            <span className="relative inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-retro-red px-1 text-[10px] font-bold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 border-2 border-retro-black bg-white shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] sm:w-96">
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-retro-black bg-retro-paper px-4 py-3">
            <h3 className="font-medium text-retro-black">Notifications</h3>
            {unreadCount !== undefined && unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1 text-xs text-stone-500 transition-colors hover:text-retro-black"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications === undefined ? (
              // Loading state
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-stone-400" />
              </div>
            ) : notifications.length === 0 ? (
              // Empty state
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-2 rounded-full bg-stone-100 p-3">
                  <Bell className="h-5 w-5 text-stone-400" />
                </div>
                <p className="text-sm font-medium text-stone-600">
                  No notifications yet
                </p>
                <p className="mt-1 text-xs text-stone-400">
                  You&apos;ll see updates here when something happens
                </p>
              </div>
            ) : (
              // Notifications list
              <div className="divide-y divide-stone-100">
                {notifications.map((notification) => (
                  <button
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full px-4 py-3 text-left transition-colors hover:bg-stone-50 ${
                      !notification.isRead ? "bg-retro-blue/5" : ""
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* Icon */}
                      <div
                        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border ${notificationColors[notification.type]}`}
                      >
                        {notificationIcons[notification.type]}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-sm ${!notification.isRead ? "font-medium text-retro-black" : "text-stone-700"}`}
                          >
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-retro-blue" />
                          )}
                        </div>

                        {notification.body && (
                          <p className="mt-0.5 line-clamp-2 text-xs text-stone-500">
                            {notification.body}
                          </p>
                        )}

                        {/* Feedback badge */}
                        {notification.feedbackTitle && (
                          <div className="mt-1.5 flex items-center gap-1.5">
                            {notification.feedbackType === "bug" ? (
                              <Bug className="h-3 w-3 text-retro-red" />
                            ) : (
                              <Lightbulb className="h-3 w-3 text-retro-blue" />
                            )}
                            <span className="line-clamp-1 text-xs text-stone-500">
                              {notification.feedbackTitle}
                            </span>
                          </div>
                        )}

                        {/* Timestamp */}
                        <p className="mt-1 text-xs text-stone-400">
                          {formatTime(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications && notifications.length > 0 && (
            <div className="border-t-2 border-retro-black bg-stone-50 px-4 py-2">
              <a
                href="/settings"
                className="text-xs text-stone-500 transition-colors hover:text-retro-black"
              >
                Manage notification preferences
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
