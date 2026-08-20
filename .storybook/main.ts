import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/react-vite";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const config: StorybookConfig = {
  stories: ["../packages/rich-text-editor/src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
  framework: {
    name: "@storybook/react-vite",
    options: {}
  },
  docs: {
    autodocs: "tag"
  },
  viteFinal(config) {
    config.resolve ??= {};
    config.resolve.alias = [
      {
        find: "@standhigher/shopify-rich-text-core/experimental",
        replacement: resolve(root, "packages/rich-text-core/src/experimental.ts")
      },
      {
        find: "@standhigher/shopify-rich-text-core",
        replacement: resolve(root, "packages/rich-text-core/src/index.ts")
      },
      ...(Array.isArray(config.resolve.alias) ? config.resolve.alias : [])
    ];

    return config;
  }
};

export default config;
