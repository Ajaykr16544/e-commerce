const path = require("path");
const dotenv = require("dotenv");

// ======================================================
// LOAD ENVIRONMENT VARIABLES
// ======================================================

// Root .env file: D:\e-commerce\.env
dotenv.config({
  path: path.join(__dirname, "../.env"),
});

// Backend .env fallback: D:\e-commerce\backend\.env
dotenv.config();

// ======================================================
// HANDLE UNCAUGHT EXCEPTIONS
// ======================================================

process.on("uncaughtException", (err) => {
  console.error("\n❌ UNCAUGHT EXCEPTION");
  console.error("Message:", err.message);
  console.error("Stack:", err.stack);

  console.error("\n🛑 Shutting down server...");
  process.exit(1);
});

// ======================================================
// IMPORT APP & DATABASE
// ======================================================

const app = require("./app");
const { connectDatabase, disconnectDatabase } = require("./config/db");

// ======================================================
// SERVER CONFIGURATION
// ======================================================

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "127.0.0.1";

// ======================================================
// START DATABASE + SERVER
// ======================================================

const startServer = async () => {
  try {
    // Connect to MongoDB
    console.log("\n🔄 Connecting to database...");

    await connectDatabase();

    console.log("✅ Database connected successfully!");

    // Start Express server
    const server = app.listen(PORT, HOST, () => {
      console.log("\n==================================================");
      console.log("🚀 SHOPNEST BACKEND SERVER");
      console.log("==================================================");
      console.log(`✅ Server: http://${HOST}:${PORT}`);
      console.log(`🌐 Mode: ${process.env.NODE_ENV || "development"}`);
      console.log(`❤️  Health: http://${HOST}:${PORT}/api/health`);
      console.log("==================================================\n");
    });

    // ==================================================
    // HANDLE UNHANDLED PROMISE REJECTIONS
    // ==================================================

    process.on("unhandledRejection", (err) => {
      console.error("\n❌ UNHANDLED PROMISE REJECTION");
      console.error("Message:", err.message);
      console.error("Stack:", err.stack);

      console.error("\n🛑 Closing server...");

      server.close(() => {
        process.exit(1);
      });
    });

    // ==================================================
    // GRACEFUL SHUTDOWN
    // ==================================================

    const shutdown = (signal) => {
      console.log(`\n⚠️ ${signal} received.`);
      console.log("🛑 Closing server...");

      server.close(async () => {
        try {
          await disconnectDatabase();
          console.log("✅ Server and database connections closed.");
          process.exit(0);
        } catch (error) {
          console.error("❌ Failed to close database connection:", error.message);
          process.exit(1);
        }
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    return server;
  } catch (error) {
    console.error("\n❌ SERVER STARTUP FAILED");
    console.error("Message:", error.message);
    process.exit(1);
  }
};

// ======================================================
// START APPLICATION
// ======================================================

startServer();

// ======================================================
// EXPORT
// ======================================================

module.exports = app;