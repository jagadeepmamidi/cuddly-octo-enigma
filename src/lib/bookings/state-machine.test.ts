import { describe, expect, it } from "vitest";
import { assertCanTransition } from "@/lib/bookings/state-machine";

describe("booking state machine", () => {
  it("allows confirmed to ongoing", () => {
    expect(() =>
      assertCanTransition("confirmed", "ongoing", "pickup_start")
    ).not.toThrow();
  });

  it("blocks completed to ongoing", () => {
    expect(() =>
      assertCanTransition("completed", "ongoing", "invalid_reopen")
    ).toThrow();
  });
});

