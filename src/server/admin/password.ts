import "server-only"

import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto"

/*
 * Password hashing with scrypt from Node's standard library (no native add-on to
 * build or audit). The parameters are stored in the hash, so they can be raised
 * later without invalidating existing passwords.
 */
const PARAMS = { N: 2 ** 15, r: 8, p: 3 }
const KEY_LENGTH = 64
const MAX_MEMORY = 128 * 1024 * 1024

export const PASSWORD_MIN_LENGTH = 12
/** Upper bound so a huge "password" cannot be used to burn CPU */
export const PASSWORD_MAX_LENGTH = 200

function derive(password: string, salt: Buffer, options: ScryptOptions, length: number) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password.normalize("NFKC"), salt, length, { ...options, maxmem: MAX_MEMORY }, (error, key) =>
      error ? reject(error) : resolve(key)
    )
  })
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16)
  const key = await derive(password, salt, PARAMS, KEY_LENGTH)
  return ["scrypt", PARAMS.N, PARAMS.r, PARAMS.p, salt.toString("base64url"), key.toString("base64url")].join("$")
}

export async function verifyPassword(password: string, stored: string) {
  const [scheme, N, r, p, salt, hash] = stored.split("$")
  if (scheme !== "scrypt" || !salt || !hash) return false

  const expected = Buffer.from(hash, "base64url")
  const actual = await derive(
    password,
    Buffer.from(salt, "base64url"),
    { N: Number(N), r: Number(r), p: Number(p) },
    expected.length
  )
  return timingSafeEqual(actual, expected)
}

/**
 * A valid hash of a random password. Verified against when the login is unknown,
 * so the response takes as long as for an existing account.
 */
let decoy: Promise<string> | undefined
export function decoyHash() {
  decoy ??= hashPassword(randomBytes(24).toString("base64url"))
  return decoy
}
