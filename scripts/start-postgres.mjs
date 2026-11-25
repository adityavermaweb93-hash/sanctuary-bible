import EmbeddedPostgres from "embedded-postgres";
import fs from "node:fs";
import path from "node:path";

const dataDir = path.resolve(process.cwd(), ".pgdata");
const isInitialized = fs.existsSync(path.join(dataDir, "PG_VERSION"));

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: "postgres",
  password: "postgres",
  port: 5432,
  persistent: true,
});

async function main() {
  if (!isInitialized) {
    console.log("Initializing local PostgreSQL cluster in .pgdata...");
    await pg.initialise();
  }
  await pg.start();
  console.log("PostgreSQL is running on localhost:5432");

  try {
    await pg.createDatabase("bible_app");
    console.log("Created database: bible_app");
  } catch {
    // Database already exists
  }

  // Keep process alive
  process.on("SIGINT", async () => {
    await pg.stop();
    process.exit(0);
  });
  process.on("SIGTERM", async () => {
    await pg.stop();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("Failed to start PostgreSQL:", err);
  process.exit(1);
});
