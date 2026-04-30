import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
);

export const supabaseSecondary = createClient(
  "https://cbhmwqgvzfubsbjoqfcd.supabase.co",
  "sb_publishable_9OMErrv22VCS2VRrpN1_RQ_xIu5_tsh",
);
