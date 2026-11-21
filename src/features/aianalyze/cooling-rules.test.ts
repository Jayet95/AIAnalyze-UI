import { describe, expect, it } from "vitest";
import { COOLING_POLL_MS, fanMotion } from "./cooling-rules";
describe("cooling presentation rules", () => {
  it("polls every five seconds", () => { expect(COOLING_POLL_MS).toBe(5000); });
  it("stops at zero RPM even when percent is positive", () => { expect(fanMotion({ name: "Fan", rpm: 0, percent: 52 }).active).toBe(false); });
  it("does not convert null RPM to spinning or zero", () => { expect(fanMotion({ name: "Fan", rpm: null, percent: 52 }).active).toBe(false); });
  it("follows percent for presentation speed", () => { expect(fanMotion({ name: "Fan", rpm: 1480, percent: 52 })).toEqual({ active: true, speed: "medium" }); });
  it("keeps zero-RPM mode neutral and stopped", () => { expect(fanMotion({ name: "Fan", rpm: 1480, percent: 52 }, true).active).toBe(false); });
});