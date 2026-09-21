import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

const USERS_FILE = path.join(process.cwd(), "src", "utils", "users.json");

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

// ---------- File I/O ----------

function ensureFile() {
  const dir = path.dirname(USERS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, "[]", "utf-8");
  }
}

export function getUsers() {
  ensureFile();
  const raw = fs.readFileSync(USERS_FILE, "utf-8");
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  ensureFile();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
}

// ---------- Core actions ----------

export async function createUser(data) {
  const errors = validateUser(data);
  if (errors.length > 0) {
    throw new Error(errors.join(", "));
  }

  const users = getUsers();

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
  saveUsers(users);

  // password-г client рүү буцаахгүй
  const { password: _omit, ...safeUser } = newUser;
  return safeUser;
}

export function deleteUser(email) {
  const users = getUsers();
  const filtered = users.filter(
    (u) => u.email.toLowerCase() !== email.toLowerCase()
  );

  if (filtered.length === users.length) {
    throw new Error("Хэрэглэгч олдсонгүй");
  }

  saveUsers(filtered);
}