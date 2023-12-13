import { z } from "zod";

export const SettingSchema = z.object({
	test: z.string().default("test"),
});
