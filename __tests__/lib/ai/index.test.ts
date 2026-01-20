/**
 * Unit tests for AI service wrappers
 * @see lib/ai/index.ts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  analyzeFeedback,
  validateAnalysisResult,
  normalizeAnalysisResult,
  type FeedbackData,
  type AIAnalysisResult,
} from "@/lib/ai/index";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("AI Service Wrappers", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  const mockFeedback: FeedbackData = {
    title: "Button doesn't work on mobile",
    description: "When I tap the submit button on my phone, nothing happens",
    type: "bug",
    screenshotUrl: "https://example.com/screenshot.png",
    metadata: {
      browser: "Safari",
      os: "iOS 17",
      url: "https://app.example.com/form",
      screenWidth: 390,
      screenHeight: 844,
    },
  };

  const mockValidAnalysisResult: AIAnalysisResult = {
    suggestedType: "bug",
    typeConfidence: 0.95,
    suggestedPriority: "high",
    priorityConfidence: 0.8,
    suggestedTags: ["mobile", "button", "touch"],
    summary: "Mobile submit button is unresponsive",
    affectedComponent: "Submit Button",
    potentialCauses: [
      "Touch event handler not attached",
      "Z-index issue blocking taps",
      "CSS preventing touch interaction",
    ],
    suggestedSolutions: [
      "Add touch event handlers",
      "Check element z-index and positioning",
      "Test with pointer-events: auto",
    ],
  };

  describe("analyzeFeedback", () => {
    describe("with OpenAI", () => {
      it("calls OpenAI API with correct parameters", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              choices: [
                {
                  message: {
                    content: JSON.stringify(mockValidAnalysisResult),
                  },
                },
              ],
            }),
        });

        await analyzeFeedback("openai", "sk-test-key", "gpt-4", mockFeedback);

        expect(mockFetch).toHaveBeenCalledWith(
          "https://api.openai.com/v1/chat/completions",
          expect.objectContaining({
            method: "POST",
            headers: expect.objectContaining({
              "Content-Type": "application/json",
              Authorization: "Bearer sk-test-key",
            }),
          })
        );
      });

      it("returns parsed analysis result from OpenAI", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              choices: [
                {
                  message: {
                    content: JSON.stringify(mockValidAnalysisResult),
                  },
                },
              ],
            }),
        });

        const result = await analyzeFeedback(
          "openai",
          "sk-test-key",
          "gpt-4",
          mockFeedback
        );

        expect(result.suggestedType).toBe("bug");
        expect(result.suggestedPriority).toBe("high");
        expect(result.suggestedTags).toContain("mobile");
      });

      it("includes screenshot in request when provided", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              choices: [
                {
                  message: {
                    content: JSON.stringify(mockValidAnalysisResult),
                  },
                },
              ],
            }),
        });

        await analyzeFeedback(
          "openai",
          "sk-test-key",
          "gpt-4",
          mockFeedback,
          "base64encodedimage"
        );

        const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
        const userMessage = callBody.messages[1];

        expect(Array.isArray(userMessage.content)).toBe(true);
        expect(userMessage.content).toHaveLength(2);
        expect(userMessage.content[1].type).toBe("image_url");
      });

      it("throws error when OpenAI API returns error", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () =>
            Promise.resolve({
              error: { message: "Invalid API key" },
            }),
        });

        await expect(
          analyzeFeedback("openai", "invalid-key", "gpt-4", mockFeedback)
        ).rejects.toThrow("Invalid API key");
      });

      it("throws error when response has no content", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              choices: [{ message: {} }],
            }),
        });

        await expect(
          analyzeFeedback("openai", "sk-test-key", "gpt-4", mockFeedback)
        ).rejects.toThrow("No response from OpenAI");
      });

      it("throws error when response is not valid JSON", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              choices: [
                {
                  message: {
                    content: "This is not JSON",
                  },
                },
              ],
            }),
        });

        await expect(
          analyzeFeedback("openai", "sk-test-key", "gpt-4", mockFeedback)
        ).rejects.toThrow("Failed to parse OpenAI response as JSON");
      });
    });

    describe("with Anthropic", () => {
      it("calls Anthropic API with correct parameters", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              content: [
                {
                  type: "text",
                  text: JSON.stringify(mockValidAnalysisResult),
                },
              ],
            }),
        });

        await analyzeFeedback(
          "anthropic",
          "sk-ant-test-key",
          "claude-3-opus-20240229",
          mockFeedback
        );

        expect(mockFetch).toHaveBeenCalledWith(
          "https://api.anthropic.com/v1/messages",
          expect.objectContaining({
            method: "POST",
            headers: expect.objectContaining({
              "Content-Type": "application/json",
              "x-api-key": "sk-ant-test-key",
              "anthropic-version": "2023-06-01",
            }),
          })
        );
      });

      it("returns parsed analysis result from Anthropic", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              content: [
                {
                  type: "text",
                  text: JSON.stringify(mockValidAnalysisResult),
                },
              ],
            }),
        });

        const result = await analyzeFeedback(
          "anthropic",
          "sk-ant-test-key",
          "claude-3-opus-20240229",
          mockFeedback
        );

        expect(result.suggestedType).toBe("bug");
        expect(result.suggestedPriority).toBe("high");
      });

      it("includes screenshot in request when provided", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              content: [
                {
                  type: "text",
                  text: JSON.stringify(mockValidAnalysisResult),
                },
              ],
            }),
        });

        await analyzeFeedback(
          "anthropic",
          "sk-ant-test-key",
          "claude-3-opus-20240229",
          mockFeedback,
          "base64encodedimage"
        );

        const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
        const userContent = callBody.messages[0].content;

        expect(userContent).toHaveLength(2);
        expect(userContent[1].type).toBe("image");
        expect(userContent[1].source.type).toBe("base64");
      });

      it("throws error when Anthropic API returns error", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () =>
            Promise.resolve({
              error: { message: "Invalid API key" },
            }),
        });

        await expect(
          analyzeFeedback(
            "anthropic",
            "invalid-key",
            "claude-3-opus-20240229",
            mockFeedback
          )
        ).rejects.toThrow("Invalid API key");
      });

      it("throws error when response has no content", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              content: [],
            }),
        });

        await expect(
          analyzeFeedback(
            "anthropic",
            "sk-ant-test-key",
            "claude-3-opus-20240229",
            mockFeedback
          )
        ).rejects.toThrow("No response from Anthropic");
      });

      it("extracts JSON from response with surrounding text", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              content: [
                {
                  type: "text",
                  text: `Here is my analysis:\n${JSON.stringify(mockValidAnalysisResult)}\n\nLet me know if you need more details.`,
                },
              ],
            }),
        });

        const result = await analyzeFeedback(
          "anthropic",
          "sk-ant-test-key",
          "claude-3-opus-20240229",
          mockFeedback
        );

        expect(result.suggestedType).toBe("bug");
      });
    });
  });

  describe("validateAnalysisResult", () => {
    it("returns true for valid analysis result", () => {
      expect(validateAnalysisResult(mockValidAnalysisResult)).toBe(true);
    });

    it("returns false for null", () => {
      expect(validateAnalysisResult(null)).toBe(false);
    });

    it("returns false for non-object", () => {
      expect(validateAnalysisResult("string")).toBe(false);
      expect(validateAnalysisResult(123)).toBe(false);
      expect(validateAnalysisResult(undefined)).toBe(false);
    });

    it("returns false for invalid suggestedType", () => {
      const invalid = { ...mockValidAnalysisResult, suggestedType: "invalid" };
      expect(validateAnalysisResult(invalid)).toBe(false);
    });

    it("returns false for invalid typeConfidence", () => {
      expect(
        validateAnalysisResult({ ...mockValidAnalysisResult, typeConfidence: -1 })
      ).toBe(false);
      expect(
        validateAnalysisResult({ ...mockValidAnalysisResult, typeConfidence: 2 })
      ).toBe(false);
      expect(
        validateAnalysisResult({
          ...mockValidAnalysisResult,
          typeConfidence: "high",
        })
      ).toBe(false);
    });

    it("returns false for invalid suggestedPriority", () => {
      const invalid = { ...mockValidAnalysisResult, suggestedPriority: "urgent" };
      expect(validateAnalysisResult(invalid)).toBe(false);
    });

    it("returns false for invalid priorityConfidence", () => {
      expect(
        validateAnalysisResult({
          ...mockValidAnalysisResult,
          priorityConfidence: -0.5,
        })
      ).toBe(false);
      expect(
        validateAnalysisResult({
          ...mockValidAnalysisResult,
          priorityConfidence: 1.5,
        })
      ).toBe(false);
    });

    it("returns false for non-array suggestedTags", () => {
      const invalid = { ...mockValidAnalysisResult, suggestedTags: "mobile" };
      expect(validateAnalysisResult(invalid)).toBe(false);
    });

    it("returns false for non-string summary", () => {
      const invalid = { ...mockValidAnalysisResult, summary: 123 };
      expect(validateAnalysisResult(invalid)).toBe(false);
    });

    it("returns false for non-array potentialCauses", () => {
      const invalid = { ...mockValidAnalysisResult, potentialCauses: "cause" };
      expect(validateAnalysisResult(invalid)).toBe(false);
    });

    it("returns false for non-array suggestedSolutions", () => {
      const invalid = { ...mockValidAnalysisResult, suggestedSolutions: "fix it" };
      expect(validateAnalysisResult(invalid)).toBe(false);
    });
  });

  describe("normalizeAnalysisResult", () => {
    it("returns complete result when all fields are valid", () => {
      const result = normalizeAnalysisResult(mockValidAnalysisResult);
      expect(result).toEqual(mockValidAnalysisResult);
    });

    it("provides defaults for missing fields", () => {
      const result = normalizeAnalysisResult({});

      expect(result.suggestedType).toBe("bug");
      expect(result.typeConfidence).toBe(0.5);
      expect(result.suggestedPriority).toBe("medium");
      expect(result.priorityConfidence).toBe(0.5);
      expect(result.suggestedTags).toEqual([]);
      expect(result.summary).toBe("No summary available");
      expect(result.potentialCauses).toEqual([]);
      expect(result.suggestedSolutions).toEqual([]);
    });

    it("clamps confidence values to [0, 1] range", () => {
      const result = normalizeAnalysisResult({
        typeConfidence: 1.5,
        priorityConfidence: -0.5,
      });

      expect(result.typeConfidence).toBe(1);
      expect(result.priorityConfidence).toBe(0);
    });

    it("limits suggestedTags to 10 items", () => {
      const manyTags = Array.from({ length: 20 }, (_, i) => `tag${i}`);
      const result = normalizeAnalysisResult({ suggestedTags: manyTags });

      expect(result.suggestedTags).toHaveLength(10);
    });

    it("limits potentialCauses to 5 items", () => {
      const manyCauses = Array.from({ length: 10 }, (_, i) => `cause${i}`);
      const result = normalizeAnalysisResult({ potentialCauses: manyCauses });

      expect(result.potentialCauses).toHaveLength(5);
    });

    it("limits suggestedSolutions to 5 items", () => {
      const manySolutions = Array.from({ length: 10 }, (_, i) => `solution${i}`);
      const result = normalizeAnalysisResult({ suggestedSolutions: manySolutions });

      expect(result.suggestedSolutions).toHaveLength(5);
    });

    it("handles non-array values gracefully", () => {
      const result = normalizeAnalysisResult({
        suggestedTags: "not an array" as unknown as string[],
        potentialCauses: null as unknown as string[],
        suggestedSolutions: undefined as unknown as string[],
      });

      expect(result.suggestedTags).toEqual([]);
      expect(result.potentialCauses).toEqual([]);
      expect(result.suggestedSolutions).toEqual([]);
    });

    it("preserves affectedComponent when provided", () => {
      const result = normalizeAnalysisResult({
        affectedComponent: "Login Form",
      });

      expect(result.affectedComponent).toBe("Login Form");
    });

    it("sets affectedComponent to undefined when not provided", () => {
      const result = normalizeAnalysisResult({});

      expect(result.affectedComponent).toBeUndefined();
    });
  });
});
