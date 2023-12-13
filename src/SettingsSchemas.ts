import { z } from "zod";

export const SettingSchema = z.object({
	hiddenPlugins: z.string().default(""),
});
