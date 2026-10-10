// Problem-wallet keys: generated here, stored encrypted (AES-256-GCM), decrypted only to sign.
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

export type Hex = `0x${string}`;

export interface NewWallet {
  address: Hex;
  keyEnc: string;
}

/** `secret` is 32 bytes as 64 hex chars (PROBLEM_WALLET_SECRET). */
function keyFrom(secret: string): Buffer {
  const key = Buffer.from(secret.replace(/^0x/, ""), "hex");
  if (key.length !== 32) throw new Error("PROBLEM_WALLET_SECRET must be 32 bytes of hex");
  return key;
}

export function encryptKey(privateKey: Hex, secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keyFrom(secret), iv);
  const data = Buffer.concat([cipher.update(privateKey, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString("base64")).join(".");
}

export function decryptKey(keyEnc: string, secret: string): Hex {
  const [iv, tag, data] = keyEnc.split(".").map((p) => Buffer.from(p, "base64"));
  const decipher = createDecipheriv("aes-256-gcm", keyFrom(secret), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8") as Hex;
}

export function newProblemWallet(secret: string): NewWallet {
  const key = generatePrivateKey();
  return { address: privateKeyToAccount(key).address, keyEnc: encryptKey(key, secret) };
}
