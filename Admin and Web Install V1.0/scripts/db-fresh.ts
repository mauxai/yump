import { execSync } from "node:child_process";
import { URL } from "node:url";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const url = new URL(dbUrl);
const dbName = decodeURIComponent(url.pathname.replace(/^\//, ""));
const user = decodeURIComponent(url.username);
const password = decodeURIComponent(url.password);
const host = url.hostname;
const port = url.port || "3306";

const MYSQL = process.env.MYSQL_BIN ?? "/Applications/XAMPP/xamppfiles/bin/mysql";
const baseArgs = [`-u${user}`, `-h${host}`, `-P${port}`];
if (password) baseArgs.push(`-p${password}`);
const base = `"${MYSQL}" ${baseArgs.join(" ")}`;

function run(cmd: string) {
  execSync(cmd, { stdio: "inherit", shell: "/bin/bash" });
}

console.log(`→ Recreating database "${dbName}"`);
run(`${base} -e "DROP DATABASE IF EXISTS \\\`${dbName}\\\`; CREATE DATABASE \\\`${dbName}\\\`;"`);

console.log("→ Applying schema from prisma/schema/");
run(`npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema --script | ${base} ${dbName}`);

console.log("→ Generating Prisma client");
run("npx prisma generate");

console.log("→ Seeding");
run("tsx prisma/seeds/index.ts");

console.log("\n✓ Database fresh and seeded.");
