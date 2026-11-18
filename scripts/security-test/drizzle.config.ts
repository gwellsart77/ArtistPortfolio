import { defineConfig } from "drizzle-kit";
// THROWAWAY test database only (localhost:5433)
export default defineConfig({
  dialect: "postgresql",
  schema: "/home/claude/artistportfolio/shared/schema.ts",
  dbCredentials: { host: "localhost", port: 5433, user: "u", password: "p", database: "art", ssl: false },
});
