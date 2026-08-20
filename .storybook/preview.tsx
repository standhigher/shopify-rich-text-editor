import type { Preview } from "@storybook/react-vite";
import { AppProvider } from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";
import "../packages/rich-text-editor/src/styles.css";

const preview: Preview = {
  decorators: [
    (Story) => (
      <AppProvider i18n={{}}>
        <div style={{ padding: "24px", background: "#f6f6f7", minHeight: "100vh" }}>
          <Story />
        </div>
      </AppProvider>
    )
  ],
  parameters: {
    controls: {
      expanded: true
    },
    layout: "fullscreen"
  }
};

export default preview;
