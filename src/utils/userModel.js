import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { Redis } from "@upstash/redis";

export const USER_TYPES = {
  STUDENT: "student",
  TEACHER: "teacher",
};

/**
 * @typedef {Object} User
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} email
 * @property {string} password   - hashed, never stored in plaintext
 * @property {string} birth_date - "YYYY-MM-DD"
 * @property {"student"|"teacher"} type
 * @property {string} created_at - ISO огноо, автоматаар үүснэ
 */

// ---------- Storage ----------
//
// On Vercel the project folder is read-only, so users are stored in Upstash Redis.
// Locally (no Redis env vars) we fall back to src/utils/users.json.

const REDIS_URL =
  process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const REDIS_TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

const redis =
  REDIS_URL && REDIS_TOKEN
    ? new Redis({ url: REDIS_URL, token: REDIS_TOKEN })
    : null;

const USERS_KEY = "users";
const USERS_FILE = path.join(process.cwd(), "src", "utils", "users.json");

function assertStorageAvailable() {
  if (!redis && process.env.VERCEL) {
    throw new Error(
      "Storage тохируулаагүй байна: Vercel дээр Upstash Redis холбоод дахин deploy хийнэ үү"
    );
  }
}

// ---------- Validation ----------

export function validateUser({ firstName, lastName, email, password, birth_date, type }) {
  const errors = [];

  if (!firstName?.trim()) errors.push("firstName шаардлагатай");
  if (!lastName?.trim()) errors.push("lastName шаардлагатай");
  if (!email?.trim() || !/^\S+@\S+\.\S+$/.test(email)) errors.push("email буруу байна");
  if (!password || password.length < 6) errors.push("password хамгийн багадаа 6 тэмдэгт байх ёстой");
  if (!birth_date || isNaN(Date.parse(birth_date))) errors.push("birth_date буруу байна");
  if (![USER_TYPES.STUDENT, USER_TYPES.TEACHER].includes(type)) errors.push("type нь student эсвэл teacher байх ёстой");

  return errors;
}

// ---------- File I/O (local dev only) ----------

function ensureFile() {
  const dir = path.dirname(USERS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, "[]", "utf-8");
  }
}

function readFileUsers() {
  ensureFile();
  const raw = fs.readFileSync(USERS_FILE, "utf-8");
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeFileUsers(users) {
  ensureFile();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
}

// ---------- Storage-agnostic read / write ----------

export async function getUsers() {
  assertStorageAvailable();

  if (redis) {
    const stored = await redis.get(USERS_KEY);
    return Array.isArray(stored) ? stored : [];
  }
  return readFileUsers();
}

async function saveUsers(users) {
  assertStorageAvailable();

  if (redis) {
    await redis.set(USERS_KEY, users);
    return;
  }
  writeFileUsers(users);
}

// ---------- Core actions ----------

export async function createUser(data) {
  const errors = validateUser(data);
  if (errors.length > 0) {
    throw new Error(errors.join(", "));
  }

  const users = await getUsers();

  const emailExists = users.some(
    (u) => u.email.toLowerCase() === data.email.toLowerCase()
  );
  if (emailExists) {
    throw new Error("Энэ email аль хэдийн бүртгэлтэй байна");
  }

  const { firstName, lastName, email, password, birth_date, type } = data;
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = {
    firstName,
    lastName,
    email,
    password: hashedPassword,
    birth_date,
    type,
    created_at: new Date().toISOString(),
  };

  users.push(newUser);
  await saveUsers(users);

  // password-г client рүү буцаахгүй
  const { password: _omit, ...safeUser } = newUser;
  return safeUser;
}

export async function deleteUser(email) {
  const users = await getUsers();
  const filtered = users.filter(
    (u) => u.email.toLowerCase() !== email.toLowerCase()
  );

  if (filtered.length === users.length) {
    throw new Error("Хэрэглэгч олдсонгүй");
  }

  await saveUsers(filtered);
}