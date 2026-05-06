import { defineConfig } from "astro/config";
import react from "@astrojs/react";

function isNodeModule(id, packageName) {
  return id.includes(`/node_modules/${packageName}/`) || id.includes(`\\node_modules\\${packageName}\\`);
}

function manualChunks(id) {
  if (isNodeModule(id, "@react-three/rapier")) {
    return undefined;
  }

  if (isNodeModule(id, "react") || isNodeModule(id, "react-dom") || isNodeModule(id, "scheduler")) {
    return "vendor-react";
  }

  if (
    isNodeModule(id, "three") ||
    isNodeModule(id, "@react-three/fiber") ||
    isNodeModule(id, "@react-three/drei")
  ) {
    return "vendor-r3f";
  }

  return undefined;
}

export default defineConfig({
  output: "static",
  integrations: [react()],
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks
        }
      }
    }
  }
});
