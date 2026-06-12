import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

// Note: Ensure tsconfig allows this or we use tsx
import apiApp from "./artifacts/api-server/src/app";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  // Mount API server on /
  // Wait, does apiApp export routers or the full app?
  // app.ts has `app.use("/api", router);` and exports app.
  // So we can mount it like this:
  app.use(apiApp);

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      root: path.resolve(process.cwd(), "artifacts/kali-portfolio"),
      configFile: path.resolve(process.cwd(), "artifacts/kali-portfolio/vite.config.ts"),
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), "artifacts/kali-portfolio/dist");
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
