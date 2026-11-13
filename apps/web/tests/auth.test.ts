import { describe, expect, it } from "vitest";
import { sessionUser } from "@/lib/auth";

describe("sessionUser (Better Auth get-session → User)", () => {
  const id = "d6814a6a-06cf-461f-828b-e5cc692dfe31";

  it("maps a signed-in session", () => {
    expect(sessionUser({ session: {}, user: { id, name: "Ada Cook", email: "a@b.com", image: "https://img/a.png" } })).toEqual({
      id,
      name: "Ada Cook",
      email: "a@b.com",
      avatarUrl: "https://img/a.png",
    });
  });

  it("falls back to the email name (magic-link users have none yet)", () => {
    expect(sessionUser({ user: { id, name: "", email: "chef@x.com", image: null } })).toEqual({ id, name: "chef", email: "chef@x.com", avatarUrl: undefined });
  });

  it("treats null, missing or malformed sessions as signed out", () => {
    expect(sessionUser(null)).toBeNull();
    expect(sessionUser({})).toBeNull();
    expect(sessionUser({ user: { id } })).toBeNull();
    expect(sessionUser({ user: { id: 42, email: "a@b.com" } })).toBeNull();
  });

  it("keeps ids as UUIDs, which the subscription/feedback guards require", () => {
    expect(sessionUser({ user: { id, email: "a@b.com" } })?.id).toMatch(/^[0-9a-f-]{36}$/);
  });
});
