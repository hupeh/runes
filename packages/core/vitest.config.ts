import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [
		react({
			babel: {
				plugins: ["babel-plugin-react-compiler"],
			},
		}),
	],
	test: {
		environment: "jsdom",
		pool: "threads",
		globals: true,
		setupFiles: ["./vitest.setup.ts"],
	},
});
