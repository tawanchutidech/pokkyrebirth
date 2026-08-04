import fs from "fs";
import path from "path";

// Local stand-in for the real Cloudflare KV namespace this app will use in
// production (see the rewrite plan's Phase 6). A single JSON file on disk,
// read/written on every call — fine for local dev, never used in prod.
const STORE_PATH = path.join(process.cwd(), ".data", "mock-kv.json");

type Store = Record<string, unknown>;

function readStore(): Store {
  try {
    return JSON.parse(fs.readFileSync(STORE_PATH, "utf8"));
  } catch {
    return {};
  }
}

function writeStore(store: Store) {
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

export function kvGet<T>(key: string): T | undefined {
  return readStore()[key] as T | undefined;
}

export function kvSet(key: string, value: unknown) {
  const store = readStore();
  store[key] = value;
  writeStore(store);
}
