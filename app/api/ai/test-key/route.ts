import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

/**
 * Test an AI API key by making a minimal request
 * POST /api/ai/test-key
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, apiKey } = body;

    if (!provider || !apiKey) {
      return NextResponse.json(
        { error: "Missing provider or apiKey" },
        { status: 400 }
      );
    }

    if (provider === "openai") {
      return await testOpenAIKey(apiKey);
    } else if (provider === "anthropic") {
      return await testAnthropicKey(apiKey);
    } else {
      return NextResponse.json(
        { error: "Invalid provider. Must be 'openai' or 'anthropic'" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error testing API key:", error);
    return NextResponse.json(
      { error: "Failed to test API key", valid: false },
      { status: 500 }
    );
  }
}

async function testOpenAIKey(apiKey: string): Promise<NextResponse> {
  try {
    
    // Test with a minimal models list request (cheap and fast)
    const response = await fetch("https://api.openai.com/v1/models", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });


    if (response.ok) {
      const data = await response.json();
      // Get available models for the UI
      const chatModels = data.data
        .filter((model: { id: string }) =>
          model.id.includes("gpt-5") ||
          model.id.includes("gpt-4") ||
          model.id.includes("gpt-3.5") ||
          model.id.includes("o1") ||
          model.id.includes("o3") ||
          model.id.includes("o4")
        )
        .map((model: { id: string }) => model.id)
        .sort();

      return NextResponse.json({
        valid: true,
        provider: "openai",
        models: chatModels,
      });
    } else {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.error?.message || `HTTP ${response.status}`;
      console.error("[test-key] OpenAI key invalid:", errorMessage, errorData);
      return NextResponse.json({
        valid: false,
        provider: "openai",
        error: errorMessage,
      });
    }
  } catch (error) {
    console.error("[test-key] OpenAI test error:", error);
    return NextResponse.json({
      valid: false,
      provider: "openai",
      error: error instanceof Error ? error.message : "Connection failed",
    });
  }
}

async function testAnthropicKey(apiKey: string): Promise<NextResponse> {
  try {
    // Test with a minimal messages request
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 1,
        messages: [{ role: "user", content: "Hi" }],
      }),
    });

    if (response.ok || response.status === 200) {
      // If successful, return valid with available models
      return NextResponse.json({
        valid: true,
        provider: "anthropic",
        models: [
          "claude-sonnet-4-5-20250514",
          "claude-opus-4-5-20250514",
          "claude-opus-4-20250514",
          "claude-sonnet-4-20250514",
          "claude-haiku-4-5-20250514",
          "claude-3-5-sonnet-20241022",
          "claude-3-5-haiku-20241022",
          "claude-3-opus-20240229",
          "claude-3-sonnet-20240229",
          "claude-3-haiku-20240307",
        ],
      });
    } else {
      const errorData = await response.json().catch(() => ({}));
      let errorMessage = `HTTP ${response.status}`;

      if (errorData.error?.message) {
        errorMessage = errorData.error.message;
      } else if (errorData.type === "error") {
        errorMessage = errorData.message || errorMessage;
      }

      // Special handling for common errors
      if (response.status === 401) {
        errorMessage = "Invalid API key";
      } else if (response.status === 403) {
        errorMessage = "API key does not have permission";
      }

      return NextResponse.json({
        valid: false,
        provider: "anthropic",
        error: errorMessage,
      });
    }
  } catch (error) {
    return NextResponse.json({
      valid: false,
      provider: "anthropic",
      error: error instanceof Error ? error.message : "Connection failed",
    });
  }
}
