// OTHER ===============================================================================================================
import { createHitHandler } from "enni-analytics";

import { enniStore, IST_OFFSET_MINUTES } from "@/lib/enni";

export const POST = createHitHandler({
    store            : enniStore,
    utcOffsetMinutes : IST_OFFSET_MINUTES,
});
