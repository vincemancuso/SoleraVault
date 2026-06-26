import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dataDir = join(root, ".postgres-data");
const passwordFile = join(root, ".postgres-pwfile");
const appPasswordFile = join(dataDir, ".app-password");
const port = "55432";
const dbName = "soleravault";
const user = "postgres";
const password = getOrCreatePassword();
const databaseUrl = `postgresql://${user}:${password}@localhost:${port}/${dbName}?schema=public`;

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    ...options
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function capture(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    ...options
  });
}

function ensureEnv() {
  const envPath = join(root, ".env");
  const current = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
  const lines = current
    .split(/\r?\n/)
    .filter((line) => line.length > 0 && !line.startsWith("DATABASE_URL="));
  lines.unshift(`DATABASE_URL="${databaseUrl}"`);
  if (!lines.some((line) => line.startsWith("OPENAI_API_KEY="))) {
    lines.push('OPENAI_API_KEY=""');
  }
  writeFileSync(envPath, `${lines.join("\n")}\n`);
}

function getOrCreatePassword() {
  if (existsSync(appPasswordFile)) {
    return readFileSync(appPasswordFile, "utf8").trim();
  }

  const envPassword = readPasswordFromEnv();
  if (envPassword) {
    mkdirSync(dataDir, { recursive: true });
    writeFileSync(appPasswordFile, `${envPassword}\n`, { mode: 0o600 });
    return envPassword;
  }

  if (existsSync(join(dataDir, "PG_VERSION"))) {
    console.error("Existing local Postgres data was found, but no local password could be read from .env or .postgres-data/.app-password.");
    console.error("Run with the existing .env file present, or stop the server and recreate .postgres-data if you want a fresh local database.");
    process.exit(1);
  }

  const generatedPassword = randomBytes(24).toString("base64url");
  mkdirSync(dataDir, { recursive: true });
  writeFileSync(appPasswordFile, `${generatedPassword}\n`, { mode: 0o600 });
  return generatedPassword;
}

function readPasswordFromEnv() {
  const envPath = join(root, ".env");
  if (!existsSync(envPath)) return null;
  const match = readFileSync(envPath, "utf8").match(/^DATABASE_URL=(?:"([^"]+)"|'([^']+)'|(.+))$/m);
  const rawUrl = match?.[1] ?? match?.[2] ?? match?.[3];
  if (!rawUrl) return null;

  try {
    const url = new URL(rawUrl);
    if (url.hostname !== "localhost" || url.port !== port || url.username !== user) return null;
    return decodeURIComponent(url.password);
  } catch {
    return null;
  }
}

function init() {
  if (existsSync(join(dataDir, "PG_VERSION"))) return;
  rmSync(join(dataDir, ".pwfile"), { force: true });
  mkdirSync(dataDir, { recursive: true });
  writeFileSync(passwordFile, `${password}\n`, { mode: 0o600 });
  run("initdb", ["-D", dataDir, "-U", user, "--auth=scram-sha-256", `--pwfile=${passwordFile}`]);
  rmSync(passwordFile, { force: true });
}

function start() {
  const status = capture("pg_ctl", ["-D", dataDir, "status"]);
  if (status.status === 0) return;
  run("pg_ctl", [
    "-D",
    dataDir,
    "-o",
    `-p ${port} -k ${dataDir}`,
    "-l",
    join(dataDir, "postgres.log"),
    "start"
  ]);
}

function ensureDatabase() {
  const env = { ...process.env, PGPASSWORD: password };
  const exists = capture("psql", [
    "-h",
    "localhost",
    "-p",
    port,
    "-U",
    user,
    "-d",
    "postgres",
    "-tAc",
    `select 1 from pg_database where datname = '${dbName}'`
  ], { env });

  if (exists.stdout.trim() === "1") return;

  run("createdb", ["-h", "localhost", "-p", port, "-U", user, dbName], { env });
}

function stop() {
  if (!existsSync(join(dataDir, "PG_VERSION"))) return;
  run("pg_ctl", ["-D", dataDir, "stop", "-m", "fast"]);
}

const command = process.argv[2] ?? "start";

if (command === "start") {
  init();
  start();
  ensureDatabase();
  ensureEnv();
  console.log(`SoleraVault local Postgres is ready on localhost:${port}.`);
  console.log(`DATABASE_URL="${databaseUrl}"`);
} else if (command === "stop") {
  stop();
} else {
  console.error(`Unknown command: ${command}`);
  process.exit(1);
}
