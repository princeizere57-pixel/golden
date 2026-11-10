import { afterEach, describe, expect, it } from "vitest";
import { signValue, verifyValue } from "@/lib/signed-cookie";

describe("signed cookies", () => {
  afterEach(() => {
    delete process.env.SESSION_SECRET;
  });

  it("round-trips a value the server signed", () => {
    const user = JSON.stringify({ id: "u1", email: "a@b.c" });
    expect(verifyValue(signValue(user))).toBe(user);
    expect(verifyValue(signValue("premium"))).toBe("premium");
  });

  it("rejects edited, unsigned or missing values (no free Premium, no fake accounts)", () => {
    const signed = signValue("free");
    const [, sig] = signed.split(".");
    expect(verifyValue(`${Buffer.from("premium").toString("base64url")}.${sig}`)).toBeNull();
    expect(verifyValue("premium")).toBeNull();
    expect(verifyValue(JSON.stringify({ id: "someone-else", email: "x@y.z" }))).toBeNull();
    expect(verifyValue("")).toBeNull();
    expect(verifyValue(undefined)).toBeNull();
  });

  it("stops verifying when the secret changes", () => {
    process.env.SESSION_SECRET = "first-secret";
    const signed = signValue("premium");
    process.env.SESSION_SECRET = "rotated-secret";
    expect(verifyValue(signed)).toBeNull();
  });
});
