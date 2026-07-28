import fs from "fs";
import path from "path";

/**
 * Atomic .env writer.
 *
 * All other installation state lives in the installations table;
 * DATABASE_URL is the one value that can't (the app needs it to
 * reach the database in the first place). The wizard's database step calls
 * this so the credentials survive a process restart, and additionally
 * patches process.env + resets the Prisma client so the RUNNING process
 * picks them up without a restart (Node, unlike PHP, reads env once at boot).
 * (AUTH_SECRET, the other env-only value, is generated at server boot by
 * next.config.mjs — it must exist before the first request, so it cannot
 * wait for the wizard.)
 *
 * Atomic-write contract: build the new contents in memory, write to a
 * sibling tmp file, then rename(). A crash mid-write cannot leave an env
 * file truncated — at worst the tmp file is orphaned and overwritten on
 * retry.
 */

const ENV_FILES = [".env", ".env.development", ".env.production"];

function setKeyInContents(contents: string, key: string, value: string): string {
  const line = `${key}="${value.replace(/"/g, '\\"')}"`;
  // Anchored regex avoids the str_replace footgun where keys with shared
  // prefixes collide (e.g. APP_URL vs APP_URL_FALLBACK).
  const pattern = new RegExp(`^${key}=.*$`, "m");
  return pattern.test(contents)
    ? contents.replace(pattern, line)
    : `${contents.replace(/\n*$/, "")}\n${line}\n`;
}

function atomicWrite(filePath: string, contents: string): void {
  const tmp = `${filePath}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, contents, "utf8");
  fs.renameSync(tmp, filePath);
}

/**
 * Write or update one env key across every env file the app's run modes
 * load (`yarn dev` → .env.development, `yarn start` → .env.production,
 * plain `next start` → .env). Files that don't exist are skipped; if none
 * exist, a fresh .env is created. Returns the files written.
 */
export function writeEnvKey(key: string, value: string): string[] {
  const root = process.cwd();
  const written: string[] = [];

  for (const name of ENV_FILES) {
    const filePath = path.join(root, name);
    if (!fs.existsSync(filePath)) continue;
    atomicWrite(filePath, setKeyInContents(fs.readFileSync(filePath, "utf8"), key, value));
    written.push(name);
  }

  if (written.length === 0) {
    const filePath = path.join(root, ".env");
    atomicWrite(filePath, setKeyInContents("", key, value));
    written.push(".env");
  }

  return written;
}
