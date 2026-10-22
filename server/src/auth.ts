import { betterAuth } from "better-auth";
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const dataDir = path.resolve(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, "mediafriend.db"));

// Initiera standardtabeller för Better Auth och MediaFriend
db.exec(`
  CREATE TABLE IF NOT EXISTS user (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    emailVerified INTEGER NOT NULL,
    image TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS session (
    id TEXT PRIMARY KEY,
    expiresAt TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    ipAddress TEXT,
    userAgent TEXT,
    userId TEXT NOT NULL REFERENCES user(id)
  );

  CREATE TABLE IF NOT EXISTS account (
    id TEXT PRIMARY KEY,
    accountId TEXT NOT NULL,
    providerId TEXT NOT NULL,
    userId TEXT NOT NULL REFERENCES user(id),
    accessToken TEXT,
    refreshToken TEXT,
    idToken TEXT,
    accessTokenExpiresAt TEXT,
    refreshTokenExpiresAt TEXT,
    scope TEXT,
    password TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS verification (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    expiresAt TEXT NOT NULL,
    createdAt TEXT,
    updatedAt TEXT
  );

  CREATE TABLE IF NOT EXISTS club_profiles (
    id TEXT PRIMARY KEY,
    userId TEXT,
    clubName TEXT NOT NULL,
    teamName TEXT DEFAULT 'Alla lag',
    defaultVenue TEXT,
    primaryColor TEXT DEFAULT '#0f3875',
    secondaryColor TEXT DEFAULT '#ffd700',
    logoUrl TEXT,
    updatedAt TEXT
  );

  CREATE TABLE IF NOT EXISTS saved_posters (
    id TEXT PRIMARY KEY,
    userId TEXT,
    matchId INTEGER,
    title TEXT,
    format TEXT,
    theme TEXT,
    customText TEXT,
    playerImageUrl TEXT,
    finalImageUrl TEXT,
    caption TEXT,
    createdAt TEXT
  );
`);

try {
  db.exec("ALTER TABLE club_profiles ADD COLUMN teamName TEXT DEFAULT 'Alla lag'");
} catch {}

export const dbInstance = db;

export const auth = betterAuth({
  database: db,
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:8081",
    "http://localhost:19006",
    "exp://localhost:8081",
    "*"
  ],
});
