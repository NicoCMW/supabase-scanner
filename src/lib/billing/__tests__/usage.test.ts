import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getUsageStatus,
  getUserPlan,
  incrementUsage,
  checkScanAllowed,
} from "../usage";

function createMockSupabase(overrides: {
  subscription?: { plan: string; status: string } | null;
  usageRecord?: { id: string; scan_count: number } | null;
}) {
  const { subscription = null, usageRecord = null } = overrides;

  return {
    from: vi.fn((table: string) => {
      if (table === "subscriptions") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: subscription,
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === "usage_records") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: usageRecord,
                  error: null,
                }),
              }),
            }),
          }),
          insert: vi.fn().mockResolvedValue({ error: null }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      return {};
    }),
  } as unknown as Parameters<typeof getUserPlan>[0];
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("getUserPlan", () => {
  it("returns free when no active subscription exists", async () => {
    const supabase = createMockSupabase({ subscription: null });
    const plan = await getUserPlan(supabase, "user-1");
    expect(plan).toBe("free");
  });

  it("returns pro when active pro subscription exists", async () => {
    const supabase = createMockSupabase({
      subscription: { plan: "pro", status: "active" },
    });
    const plan = await getUserPlan(supabase, "user-1");
    expect(plan).toBe("pro");
  });
});

describe("getUsageStatus", () => {
  it("returns zero usage for new user", async () => {
    const supabase = createMockSupabase({});
    const status = await getUsageStatus(supabase, "user-1");

    expect(status.plan).toBe("free");
    expect(status.scansUsed).toBe(0);
    expect(status.scansLimit).toBe(3);
    expect(status.canScan).toBe(true);
  });

  it("returns canScan false when limit reached", async () => {
    const supabase = createMockSupabase({
      usageRecord: { id: "r-1", scan_count: 3 },
    });
    const status = await getUsageStatus(supabase, "user-1");

    expect(status.scansUsed).toBe(3);
    expect(status.canScan).toBe(false);
  });

  it("returns unlimited for pro users", async () => {
    const supabase = createMockSupabase({
      subscription: { plan: "pro", status: "active" },
      usageRecord: { id: "r-1", scan_count: 100 },
    });
    const status = await getUsageStatus(supabase, "user-1");

    expect(status.plan).toBe("pro");
    expect(status.scansLimit).toBe(Infinity);
    expect(status.canScan).toBe(true);
  });
});

describe("checkScanAllowed", () => {
  it("allows scan when under limit", async () => {
    const supabase = createMockSupabase({
      usageRecord: { id: "r-1", scan_count: 1 },
    });
    const result = await checkScanAllowed(supabase, "user-1");

    expect(result.allowed).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it("blocks scan when at limit", async () => {
    const supabase = createMockSupabase({
      usageRecord: { id: "r-1", scan_count: 3 },
    });
    const result = await checkScanAllowed(supabase, "user-1");

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("Monthly scan limit reached");
    expect(result.reason).toContain("Upgrade to Pro");
  });

  it("always allows pro users", async () => {
    const supabase = createMockSupabase({
      subscription: { plan: "pro", status: "active" },
      usageRecord: { id: "r-1", scan_count: 999 },
    });
    const result = await checkScanAllowed(supabase, "user-1");

    expect(result.allowed).toBe(true);
  });
});

describe("incrementUsage", () => {
  it("creates new record when none exists", async () => {
    const supabase = createMockSupabase({});
    await incrementUsage(supabase, "user-1");

    expect(supabase.from).toHaveBeenCalledWith("usage_records");
  });

  it("updates existing record", async () => {
    const supabase = createMockSupabase({
      usageRecord: { id: "r-1", scan_count: 2 },
    });
    await incrementUsage(supabase, "user-1");

    expect(supabase.from).toHaveBeenCalledWith("usage_records");
  });
});
