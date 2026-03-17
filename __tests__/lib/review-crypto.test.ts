import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/review-crypto";

describe("review-crypto", () => {
  it("hashes and verifies a password correctly", async () => {
    const password = "test-password-123";
    const hash = await hashPassword(password);
    expect(hash).toContain(":");
    expect(await verifyPassword(password, hash)).toBe(true);
  });

  it("rejects incorrect passwords", async () => {
    const hash = await hashPassword("correct-password");
    expect(await verifyPassword("wrong-password", hash)).toBe(false);
  });

  it("produces different hashes for the same password (unique salts)", async () => {
    const hash1 = await hashPassword("same-password");
    const hash2 = await hashPassword("same-password");
    expect(hash1).not.toBe(hash2);
    // But both should verify
    expect(await verifyPassword("same-password", hash1)).toBe(true);
    expect(await verifyPassword("same-password", hash2)).toBe(true);
  });
});
