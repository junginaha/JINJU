import { migrateSchema } from "../lib/db";

async function main() {
  await migrateSchema();
  console.log("Jinju database migration complete.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
