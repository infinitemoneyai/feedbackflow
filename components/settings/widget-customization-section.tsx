"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import {
  Palette,
  Loader2,
  Check,
  RotateCcw,
  Upload,
  X,
  MessageSquare,
  Camera,
  Mic,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface WidgetCustomizationSectionProps {
  widgetId: Id<"widgets">;
  projectName?: string;
  hideHeader?: boolean;
}

type Position = "bottom-right" | "bottom-left" | "top-right" | "top-left";

const POSITIONS: { value: Position; label: string }[] = [
  { value: "bottom-right", label: "Bottom Right" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "top-right", label: "Top Right" },
  { value: "top-left", label: "Top Left" },
];

const DEFAULT_COLORS = {
  primaryColor: "#1a1a1a",
  backgroundColor: "#ffffff",
  textColor: "#1a1a1a",
};

export function WidgetCustomizationSection({
  widgetId,
  projectName,
  hideHeader = false,
}: WidgetCustomizationSectionProps) {
  const config = useQuery(api.widgetConfig.getWidgetConfig, { widgetId });
  const saveConfigMutation = useMutation(api.widgetConfig.saveWidgetConfig);
  const resetConfigMutation = useMutation(api.widgetConfig.resetWidgetConfig);
  const generateUploadUrlMutation = useMutation(api.widgetConfig.generateLogoUploadUrl);
  const uploadLogoMutation = useMutation(api.widgetConfig.uploadLogo);
  const removeLogoMutation = useMutation(api.widgetConfig.removeLogo);

  // Local state for form fields
  const [position, setPosition] = useState<Position>("bottom-right");
  const [buttonText, setButtonText] = useState("Send Feedback");
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_COLORS.primaryColor);
  const [backgroundColor, setBackgroundColor] = useState(DEFAULT_COLORS.backgroundColor);
  const [textColor, setTextColor] = useState(DEFAULT_COLORS.textColor);
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);

  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync local state with fetched config
  useEffect(() => {
    if (config) {
      setPosition(config.position || "bottom-right");
      setButtonText(config.buttonText || "Send Feedback");
      setPrimaryColor(config.primaryColor || DEFAULT_COLORS.primaryColor);
      setBackgroundColor(config.backgroundColor || DEFAULT_COLORS.backgroundColor);
      setTextColor(config.textColor || DEFAULT_COLORS.textColor);
      setLogoUrl(config.logoUrl);
    }
  }, [config]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      await saveConfigMutation({
        widgetId,
        position,
        buttonText: buttonText || "Send Feedback",
        primaryColor,
        backgroundColor,
        textColor,
        logoUrl,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save configuration");
    } finally {
      setIsSaving(false);
    }
  }, [
    widgetId,
    position,
    buttonText,
    primaryColor,
    backgroundColor,
    textColor,
    logoUrl,
    saveConfigMutation,
  ]);

  const handleReset = useCallback(async () => {
    if (!confirm("Are you sure you want to reset to default settings?")) {
      return;
    }

    setIsResetting(true);
    setError(null);

    try {
      await resetConfigMutation({ widgetId });
      // Reset local state
      setPosition("bottom-right");
      setButtonText("Send Feedback");
      setPrimaryColor(DEFAULT_COLORS.primaryColor);
      setBackgroundColor(DEFAULT_COLORS.backgroundColor);
      setTextColor(DEFAULT_COLORS.textColor);
      setLogoUrl(undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset configuration");
    } finally {
      setIsResetting(false);
    }
  }, [widgetId, resetConfigMutation]);

  const handleLogoUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please upload an image file");
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError("Logo must be smaller than 2MB");
        return;
      }

      setIsUploadingLogo(true);
      setError(null);

      try {
        // Get upload URL
        const uploadUrl = await generateUploadUrlMutation({ widgetId });

        // Upload the file
        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!response.ok) {
          throw new Error("Upload failed");
        }

        const { storageId } = await response.json();

        // Update widget config with logo
        const result = await uploadLogoMutation({
          widgetId,
          storageId,
        });

        setLogoUrl(result.logoUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to upload logo");
      } finally {
        setIsUploadingLogo(false);
      }
    },
    [widgetId, generateUploadUrlMutation, uploadLogoMutation]
  );

  const handleRemoveLogo = useCallback(async () => {
    try {
      await removeLogoMutation({ widgetId });
      setLogoUrl(undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove logo");
    }
  }, [widgetId, removeLogoMutation]);

  if (!config) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - only show if not hidden */}
      {!hideHeader && (
        <div className="rounded border-2 border-retro-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 border-retro-yellow bg-retro-yellow/10">
              <Palette className="h-6 w-6 text-retro-yellow" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-retro-black">
                Widget Customization
              </h2>
              <p className="mt-1 text-sm text-stone-600">
                Customize how the feedback widget appears on your website.
                {projectName && (
                  <span className="ml-1 font-medium text-stone-700">
                    ({projectName})
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Configuration Form */}
        <div className="space-y-6">
          {/* Position */}
          <div className="rounded border-2 border-retro-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
            <h3 className="mb-4 font-semibold text-retro-black">Position</h3>
            <div className="grid grid-cols-2 gap-3">
              {POSITIONS.map((pos) => (
                <button
                  key={pos.value}
                  onClick={() => setPosition(pos.value)}
                  className={`rounded border-2 px-4 py-3 text-sm font-medium transition-all ${
                    position === pos.value
                      ? "border-retro-black bg-retro-yellow/20 shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]"
                      : "border-stone-200 bg-white hover:border-stone-300"
                  }`}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>

          {/* Button Text */}
          <div className="rounded border-2 border-retro-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
            <h3 className="mb-4 font-semibold text-retro-black">Button Text</h3>
            <input
              type="text"
              value={buttonText}
              onChange={(e) => setButtonText(e.target.value)}
              placeholder="Send Feedback"
              maxLength={30}
              className="w-full rounded border-2 border-stone-200 bg-stone-50 px-4 py-2.5 text-sm transition-colors focus:border-retro-black focus:bg-white focus:outline-none"
            />
            <p className="mt-2 text-xs text-stone-500">
              {buttonText.length}/30 characters
            </p>
          </div>

          {/* Colors */}
          <div className="rounded border-2 border-retro-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
            <h3 className="mb-4 font-semibold text-retro-black">Colors</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">
                  Primary Color (Button)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded border-2 border-stone-200"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 rounded border-2 border-stone-200 bg-stone-50 px-3 py-2 font-mono text-sm uppercase focus:border-retro-black focus:bg-white focus:outline-none"
                    maxLength={7}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">
                  Background Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded border-2 border-stone-200"
                  />
                  <input
                    type="text"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="flex-1 rounded border-2 border-stone-200 bg-stone-50 px-3 py-2 font-mono text-sm uppercase focus:border-retro-black focus:bg-white focus:outline-none"
                    maxLength={7}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-stone-700">
                  Text Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded border-2 border-stone-200"
                  />
                  <input
                    type="text"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="flex-1 rounded border-2 border-stone-200 bg-stone-50 px-3 py-2 font-mono text-sm uppercase focus:border-retro-black focus:bg-white focus:outline-none"
                    maxLength={7}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Logo */}
          <div className="rounded border-2 border-retro-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
            <h3 className="mb-4 font-semibold text-retro-black">Logo (Optional)</h3>
            {logoUrl ? (
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img
                    src={logoUrl}
                    alt="Widget logo"
                    className="h-16 w-16 rounded border-2 border-stone-200 object-contain"
                  />
                  <button
                    onClick={handleRemoveLogo}
                    className="absolute -right-2 -top-2 rounded-full border-2 border-retro-black bg-white p-1 shadow-sm hover:bg-red-50"
                  >
                    <X className="h-3 w-3 text-retro-red" />
                  </button>
                </div>
                <div className="text-sm text-stone-500">
                  <p>Logo uploaded</p>
                  <label className="cursor-pointer text-retro-blue hover:underline">
                    Change logo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            ) : (
              <label
                className={`flex cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed border-stone-300 bg-stone-50 p-6 transition-colors hover:border-retro-black hover:bg-stone-100 ${
                  isUploadingLogo ? "pointer-events-none opacity-50" : ""
                }`}
              >
                {isUploadingLogo ? (
                  <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
                ) : (
                  <>
                    <Upload className="mb-2 h-8 w-8 text-stone-400" />
                    <span className="text-sm font-medium text-stone-600">
                      Upload logo
                    </span>
                    <span className="mt-1 text-xs text-stone-400">
                      PNG, JPG up to 2MB
                    </span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  disabled={isUploadingLogo}
                />
              </label>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 rounded border-2 border-retro-black bg-retro-black px-6 py-2.5 text-sm font-medium text-white shadow-[4px_4px_0px_0px_#888] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : saveSuccess ? (
                <Check className="h-4 w-4" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {saveSuccess ? "Saved!" : "Save Changes"}
            </button>
            <button
              onClick={handleReset}
              disabled={isResetting}
              className="flex items-center gap-2 rounded border-2 border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 transition-all hover:border-retro-black disabled:opacity-50"
            >
              {isResetting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
              Reset to Defaults
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <X className="h-4 w-4" />
              {error}
            </div>
          )}
        </div>

        {/* Live Preview */}
        <div className="lg:sticky lg:top-6">
          <div className="rounded border-2 border-retro-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
            <h3 className="mb-4 font-semibold text-retro-black">Live Preview</h3>
            <WidgetPreview
              position={position}
              buttonText={buttonText}
              primaryColor={primaryColor}
              backgroundColor={backgroundColor}
              textColor={textColor}
              logoUrl={logoUrl}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface WidgetPreviewProps {
  position: Position;
  buttonText: string;
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  logoUrl?: string;
}

function WidgetPreview({
  position,
  buttonText,
  primaryColor,
  backgroundColor,
  textColor,
  logoUrl,
}: WidgetPreviewProps) {
  const [showModal, setShowModal] = useState(false);

  // Determine position styles for the button
  const positionStyles: Record<Position, string> = {
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
  };

  return (
    <div className="relative h-[500px] overflow-hidden rounded border-2 border-stone-200 bg-gradient-to-br from-stone-50 to-stone-100">
      {/* Fake website content */}
      <div className="p-4">
        <div className="mb-4 h-8 w-32 rounded bg-stone-300"></div>
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-stone-200"></div>
          <div className="h-4 w-3/4 rounded bg-stone-200"></div>
          <div className="h-4 w-5/6 rounded bg-stone-200"></div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="h-24 rounded bg-stone-200"></div>
          <div className="h-24 rounded bg-stone-200"></div>
        </div>
      </div>

      {/* Widget Button */}
      <button
        onClick={() => setShowModal(true)}
        className={`absolute ${positionStyles[position]} flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-lg transition-transform hover:scale-105`}
        style={{ backgroundColor: primaryColor, color: backgroundColor }}
      >
        {logoUrl ? (
          <img src={logoUrl} alt="" className="h-5 w-5 rounded-full object-cover" />
        ) : (
          <MessageSquare className="h-4 w-4" />
        )}
        <span>{buttonText || "Send Feedback"}</span>
      </button>

      {/* Widget Modal */}
      {showModal && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 p-4">
          <div
            className="w-full max-w-sm rounded-lg shadow-xl"
            style={{ backgroundColor }}
          >
            {/* Modal Header */}
            <div
              className="flex items-center justify-between rounded-t-lg px-4 py-3"
              style={{ backgroundColor: primaryColor }}
            >
              <div className="flex items-center gap-2">
                {logoUrl && (
                  <img src={logoUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
                )}
                <span className="font-medium" style={{ color: backgroundColor }}>
                  {buttonText || "Send Feedback"}
                </span>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 transition-opacity hover:opacity-80"
                style={{ color: backgroundColor }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4">
              {/* Type selector */}
              <div className="mb-4 flex gap-2">
                <button
                  className="flex flex-1 items-center justify-center gap-2 rounded border-2 py-2 text-sm font-medium"
                  style={{ borderColor: primaryColor, color: textColor }}
                >
                  Bug
                </button>
                <button
                  className="flex flex-1 items-center justify-center gap-2 rounded border-2 border-transparent py-2 text-sm"
                  style={{ backgroundColor: `${primaryColor}10`, color: textColor }}
                >
                  Feature
                </button>
              </div>

              {/* Screenshot/Record buttons */}
              <div className="mb-4 flex gap-2">
                <button
                  className="flex flex-1 items-center justify-center gap-2 rounded py-2 text-sm"
                  style={{ backgroundColor: `${primaryColor}15`, color: textColor }}
                >
                  <Camera className="h-4 w-4" />
                  Screenshot
                </button>
                <button
                  className="flex flex-1 items-center justify-center gap-2 rounded py-2 text-sm"
                  style={{ backgroundColor: `${primaryColor}15`, color: textColor }}
                >
                  <Mic className="h-4 w-4" />
                  Record
                </button>
              </div>

              {/* Title input */}
              <input
                type="text"
                placeholder="Title"
                className="mb-3 w-full rounded border px-3 py-2 text-sm"
                style={{ borderColor: `${textColor}30`, color: textColor }}
              />

              {/* Description */}
              <textarea
                placeholder="Describe your feedback..."
                className="mb-4 h-20 w-full resize-none rounded border px-3 py-2 text-sm"
                style={{ borderColor: `${textColor}30`, color: textColor }}
              />

              {/* Submit button */}
              <button
                className="w-full rounded py-2.5 text-sm font-medium"
                style={{ backgroundColor: primaryColor, color: backgroundColor }}
              >
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
