"use client";

import { Icon } from "@/components/ui/icon";

interface ToastProps {
  kind: "success" | "error";
  message: string;
}

export function Toast({ kind, message }: ToastProps) {
  return (
    <div className="pointer-events-none absolute bottom-4 left-4 right-4 z-50 animate-ff-fade-up">
      <div
        className={`pointer-events-auto flex items-center justify-between gap-3 rounded border-2 border-retro-black bg-white px-3 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] ${
          kind === "success" ? "" : "bg-retro-red/5"
        }`}
      >
        <div className="flex items-center gap-2">
          <Icon
            name={kind === "success" ? "solar:check-circle-linear" : "solar:danger-triangle-linear"}
            size={16}
            className={kind === "success" ? "text-retro-blue" : "text-retro-red"}
          />
          <span className="text-xs font-medium text-stone-700">{message}</span>
        </div>
      </div>
    </div>
  );
}

interface ShareModalProps {
  url: string;
  onClose: () => void;
}

export function ShareModal({ url, onClose }: ShareModalProps) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-retro-black/20 p-6">
      <div className="w-full max-w-[420px] rounded border-2 border-retro-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,0.25)]">
        <div className="flex items-center justify-between border-b-2 border-retro-black px-4 py-3">
          <div className="font-mono text-xs font-bold uppercase tracking-wider text-stone-700">
            Share link
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-stone-500 transition-colors hover:bg-stone-100 hover:text-retro-black"
          >
            <Icon name="solar:close-square-linear" size={18} />
          </button>
        </div>
        <div className="space-y-3 p-4">
          <p className="text-xs text-stone-600">
            Clipboard access is blocked by your browser. Copy the link below:
          </p>
          <div className="rounded border-2 border-stone-200 bg-stone-50 p-3">
            <code className="block select-all break-all font-mono text-[11px] text-stone-700">
              {url}
            </code>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="rounded border-2 border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface DeleteConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmModal({ onConfirm, onCancel }: DeleteConfirmModalProps) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-retro-black/20 p-6">
      <div className="w-full max-w-[420px] rounded border-2 border-retro-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,0.25)]">
        <div className="flex items-center justify-between border-b-2 border-retro-black px-4 py-3">
          <div className="font-mono text-xs font-bold uppercase tracking-wider text-stone-700">
            Delete ticket
          </div>
          <button
            onClick={onCancel}
            className="rounded p-1 text-stone-500 transition-colors hover:bg-stone-100 hover:text-retro-black"
          >
            <Icon name="solar:close-square-linear" size={18} />
          </button>
        </div>
        <div className="space-y-3 p-4">
          <p className="text-sm font-semibold text-stone-800">This cannot be undone.</p>
          <p className="text-xs text-stone-600">
            This will delete the ticket and associated drafts, exports, comments, and conversation.
          </p>
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={onCancel}
              className="rounded border-2 border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="rounded border-2 border-retro-black bg-retro-red px-3 py-1.5 text-xs font-medium text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] transition-transform hover:translate-x-[1px] hover:translate-y-[1px]"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
