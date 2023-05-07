import { defineConfig } from "cypress"
import react from "@vitejs/plugin-react-swc"
import { defineConfig as defineViteConfig } from "vite"

export default defineConfig({
  component: {
    viewportWidth: 1024,
    viewportHeight: 764,
    devServer: {
      framework: "react",
      bundler: "vite",
      viteConfig: defineViteConfig({
        plugins: [
          react()
        ]
      })
    },
  },
})
