// OTHER ===============================================================================================================
import { MemoryStore, type CounterStore } from "enni-analytics";
import { DynamoStore } from "enni-analytics/dynamo";

// One counter store shared by the hit endpoint and the dashboard. With
// ENNI_TABLE set (Amplify env var) counters persist in DynamoDB; without
// it — local dev — they live in memory and reset on server restart.
export const enniStore : CounterStore = process.env.ENNI_TABLE
    ? new DynamoStore()
    : new MemoryStore();

// Day bucketing for counters and dashboard ranges, in IST rather than UTC.
export const IST_OFFSET_MINUTES = 330;
