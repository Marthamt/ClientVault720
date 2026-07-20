import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware with high limits for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Ensure uploads directory exists
  const UPLOADS_DIR = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  // API Route: File Upload
  app.post("/api/files/upload", (req: express.Request, res: express.Response) => {
    try {
      const { userId, fileName, fileType, content } = req.body;

      if (!userId || !fileName || !content) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Sanitize userId to prevent path traversal
      if (!/^[a-zA-Z0-9_\-]+$/.test(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const fileId = Date.now() + "_" + Math.random().toString(36).substring(2, 9);
      const userDir = path.join(UPLOADS_DIR, userId);

      if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
      }

      const filePath = path.join(userDir, fileId);
      
      // Decode base64
      let base64Data = content;
      if (content.includes(";base64,")) {
        base64Data = content.split(";base64,").pop();
      }

      fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"));

      res.json({ fileId });
    } catch (error: any) {
      console.error("Upload error:", error);
      res.status(500).json({ error: error.message || "Failed to upload file" });
    }
  });

  // API Route: File Download
  app.get("/api/files/download/:userId/:fileId", (req: express.Request, res: express.Response) => {
    try {
      const { userId, fileId } = req.params;
      const { name, type } = req.query;

      if (!/^[a-zA-Z0-9_\-]+$/.test(userId) || !/^[a-zA-Z0-9_\-\.]+$/.test(fileId)) {
        return res.status(400).json({ error: "Invalid path parameters" });
      }

      const filePath = path.join(UPLOADS_DIR, userId, fileId);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "File not found" });
      }

      const fileName = (name as string) || "download";
      const contentType = (type as string) || "application/octet-stream";

      res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(fileName)}"`);
      res.setHeader("Content-Type", contentType);

      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error: any) {
      console.error("Download error:", error);
      res.status(500).json({ error: "Failed to download file" });
    }
  });

  // API Route: File Delete
  app.delete("/api/files/delete/:userId/:fileId", (req: express.Request, res: express.Response) => {
    try {
      const { userId, fileId } = req.params;

      if (!/^[a-zA-Z0-9_\-]+$/.test(userId) || !/^[a-zA-Z0-9_\-\.]+$/.test(fileId)) {
        return res.status(400).json({ error: "Invalid path parameters" });
      }

      const filePath = path.join(UPLOADS_DIR, userId, fileId);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Delete error:", error);
      res.status(500).json({ error: "Failed to delete file" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: express.Request, res: express.Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
