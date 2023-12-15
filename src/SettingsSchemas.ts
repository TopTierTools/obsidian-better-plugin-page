import { z } from "zod";

export const SettingSchema = z.object({
	hiddenPlugins: z.string().default(""),
	savedPlugins: z.string().default(""),
	pluginNoteCache: z.record(z.string()).default({}),
	pluginNoteFeatureEnabled: z.boolean().default(true),
});
