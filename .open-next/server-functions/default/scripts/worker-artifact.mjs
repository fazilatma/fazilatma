#!/usr/bin/env node
/**
 * Fast Cloudflare deploy support.
 *
 * Cloudflare Workers Builds still needs to run after a git push, but it does not
 * need to rebuild the whole Next.js app if a fresh OpenNext artifact is already
 * committed. This script keeps a source hash beside `.open-next` and lets
 * `npm run deploy:cf` deploy the committed artifact immediately when it matches.
 *
 * Commands:
 *   node scripts/worker-artifact.mjs build   # build OpenNext and write metadata
 *   node scripts/worker-artifact.mjs deploy  # use fresh artifact, otherwise build fallback, then deploy
 */
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const artifactDir = path.join(root, ".open-next");
const metadataPath = path.join(artifactDir, "optibid-artifact.json");

const sourceFolders = ["src", "public", "scripts", "data"];
const sourceFiles = [
  ".env.example",
  ".gitignore",
  "drizzle.config.json",
  "eslint.config.mjs",
  "liara.json",
  "next.config.ts",
  "open-next.config.ts",
  "package-lock.json",
  "package.json",
  "postcss.config.mjs",
  "README_CLOUDFLARE.md",
  "README_DEPLOY.md",
  "README_SELLER_RATING.md",
  "tsconfig.json",
  "wrangler.jsonc",
];

const ignoredFolders = new Set([
  ".git",
  ".next",
  ".open-next",
  ".wrangler",
  "node_modules",
  "src/generated",
]);

// This file is intentionally loaded at runtime from GitHub raw. Changing only
// this file should not invalidate the compiled Worker artifact.
const runtimeOnlyFiles = new Set(["data/live-content.json"]);

function toPosix(relativePath) {
  return relativePath.split(path.sep).join("/");
}

function shouldSkip(relativePath) {
  const posix = toPosix(relativePath);
  if (runtimeOnlyFiles.has(posix)) return true;
  return Array.from(ignoredFolders).some((folder) => {
    const normalized = folder.replaceAll("\\", "/");
    return posix === normalized || posix.startsWith(`${normalized}/`);
  });
}

function collectFiles() {
  const files = new Set();

  function add(relativePath) {
    const posix = toPosix(relativePath);
    if (shouldSkip(posix)) return;
    const absolute = path.join(root, relativePath);
    if (!existsSync(absolute) || !statSync(absolute).isFile()) return;
    files.add(posix);
  }

  function walk(folder) {
    const absolute = path.join(root, folder);
    if (!existsSync(absolute)) return;
    for (const entry of readdirSync(absolute, { withFileTypes: true })) {
      const relative = path.join(folder, entry.name);
      const posix = toPosix(relative);
      if (shouldSkip(posix)) continue;
      if (entry.isDirectory()) {
        walk(relative);
      } else if (entry.isFile()) {
        add(relative);
      }
    }
  }

  for (const folder of sourceFolders) walk(folder);
  for (const file of sourceFiles) add(file);
  return Array.from(files).sort();
}

export function computeWorkerSourceHash() {
  const hash = createHash("sha256");
  const files = collectFiles();
  hash.update("optibid-worker-source-v1\n");
  for (const file of files) {
    hash.update(`${file}\0`);
    hash.update(readFileSync(path.join(root, file)));
    hash.update("\0");
  }
  return { hash: hash.digest("hex"), files };
}

function readMetadata() {
  if (!existsSync(metadataPath)) return null;
  try {
    return JSON.parse(readFileSync(metadataPath, "utf8"));
  } catch {
    return null;
  }
}

function writeMetadata(sourceHash, fileCount) {
  mkdirSync(artifactDir, { recursive: true });
  writeFileSync(
    metadataPath,
    `${JSON.stringify(
      {
        sourceHash,
        fileCount,
        builtAt: new Date().toISOString(),
        builder: "scripts/worker-artifact.mjs",
      },
      null,
      2
    )}\n`,
    "utf8"
  );
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
    ...options,
  });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function artifactExists() {
  return (
    existsSync(path.join(artifactDir, "worker.js")) &&
    existsSync(path.join(artifactDir, "assets")) &&
    existsSync(path.join(artifactDir, "server-functions", "default", "handler.mjs"))
  );
}

function isArtifactFresh(sourceHash) {
  const metadata = readMetadata();
  return Boolean(artifactExists() && metadata?.sourceHash === sourceHash);
}

function build() {
  const { hash, files } = computeWorkerSourceHash();
  console.log(`Worker source hash: ${hash} (${files.length} files)`);
  run("node", ["scripts/generate-source-snapshot.mjs"]);
  run("opennextjs-cloudflare", ["build"]);
  writeMetadata(hash, files.length);
  console.log(`✔ Fresh OpenNext artifact prepared at .open-next (${hash.slice(0, 12)}…)`);
}

function deploy() {
  const { hash } = computeWorkerSourceHash();
  if (isArtifactFresh(hash)) {
    console.log(`✔ Using committed OpenNext artifact (${hash.slice(0, 12)}…) — skipping Next.js build.`);
  } else {
    console.log("⚠ OpenNext artifact is missing or stale; building before deploy as a safe fallback.");
    build();
  }

  run("node", ["scripts/cf-ensure-kv.mjs"]);
  run("wrangler", ["deploy"]);
}

const command = process.argv[2] || "build";
if (command === "build") {
  build();
} else if (command === "deploy") {
  deploy();
} else if (command === "hash") {
  const { hash, files } = computeWorkerSourceHash();
  console.log(JSON.stringify({ hash, fileCount: files.length }, null, 2));
} else {
  console.error(`Unknown command: ${command}`);
  process.exit(1);
}
