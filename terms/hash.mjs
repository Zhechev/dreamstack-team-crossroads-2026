// Prints the 0x-prefixed sha256 of a Terms version and the SQL row for terms_versions.
// Usage: node terms/hash.mjs [version]   (default: v1)
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const version = process.argv[2] ?? "v1";
const file = new URL(`./${version}.md`, import.meta.url);
const hash = "0x" + createHash("sha256").update(readFileSync(file)).digest("hex");

console.log(`TERMS_HASH=${hash}`);
console.log(
  `insert into terms_versions (version, hash) values ('${version}', '${hash}') on conflict (version) do nothing;`,
);
