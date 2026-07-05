// OTHER ===============================================================================================================
import { createAdminHandler } from "enni-analytics";

import { enniStore, IST_OFFSET_MINUTES } from "@/lib/enni";

export const dynamic = "force-dynamic";

// Basic auth: any username, password from the ENNI_PASSWORD env var.
export const GET = createAdminHandler({
    store            : enniStore,
    siteName         : "dbie.rbihub.in",
    utcOffsetMinutes : IST_OFFSET_MINUTES,
});
