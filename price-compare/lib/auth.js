import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
  if (!fs.existsSync(SETTINGS_FILE)) {
    const defaultSettings = {
      outsideInsideEnabled: false,
      outsideSources: {
        trendyol: true,
        amazonAe: true,
        aliexpress: false,
      },
      customs: {
        defaultDutyPct: 20,
        shippingIntl: 500000,
        insurancePct: 2,
        vatPct: 10,
        hilalPct: 1,
        currencyFeePct: 2.5,
        platformFeePct: 9,
        clearanceFee: 800000,
        warehousingFee: 200000,
        domesticShipping: 150000,
      },
      admin: {
        user: "admin",
        pass: "1234"
      }
    };
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2));
  }
}

export function getUsers() {
  ensureDataDir();
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  } catch {
    return [];
  }
}

export function saveUsers(users) {
  ensureDataDir();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

export function getSettings() {
  ensureDataDir();
  try {
    return JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf-8"));
  } catch {
    return { outsideInsideEnabled: false };
  }
}

export function saveSettings(settings) {
  ensureDataDir();
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

export function findUserByEmailOrMobile(emailOrMobile) {
  const users = getUsers();
  return users.find(u => u.email === emailOrMobile || u.mobile === emailOrMobile);
}

export function createUser({ email, mobile, password, name }) {
  const users = getUsers();
  if (users.find(u => u.email === email || (mobile && u.mobile === mobile))) {
    throw new Error("کاربر با این ایمیل یا موبایل قبلا ثبت شده");
  }
  const newUser = {
    id: Date.now().toString(),
    email: email || "",
    mobile: mobile || "",
    password, // در پروداکشن هش کنید
    name: name || email?.split("@")[0] || mobile || "کاربر",
    createdAt: new Date().toISOString(),
    plan: "free"
  };
  users.push(newUser);
  saveUsers(users);
  return newUser;
}

export function validateUser(emailOrMobile, password) {
  const users = getUsers();
  const user = users.find(u => (u.email === emailOrMobile || u.mobile === emailOrMobile) && u.password === password);
  return user || null;
}

export function validateAdmin(user, pass) {
  const settings = getSettings();
  return settings.admin && settings.admin.user === user && settings.admin.pass === pass;
}
