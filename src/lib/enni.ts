// OTHER ===============================================================================================================
import { MemoryStore, type CounterStore } from "enni-analytics";
import { DynamoStore } from "enni-analytics/dynamo";

// One counter store shared by the hit endpoint and the dashboard. With
// ENNI_TABLE set (Amplify env var) counters persist in DynamoDB; without
// it — local dev — they live in memory and reset on server restart.
// ENNI_SITE partitions the shared table per environment (branch-level
// Amplify env var: "dev" / "staging"; unset on main so production
// counters keep clean keys) — each environment's /enni shows only its
// own traffic.
export const enniStore : CounterStore = process.env.ENNI_TABLE
    ? new DynamoStore({site : process.env.ENNI_SITE})
    : new MemoryStore();

// Day bucketing for counters and dashboard ranges, in IST rather than UTC.
export const IST_OFFSET_MINUTES = 330;
