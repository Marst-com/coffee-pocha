import express from "express";
import cors from "cors";
import Database from "better-sqlite3";
import XLSX from "xlsx";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const db = new Database(
  path.join(__dirname, "../data/coffee-pocha.db")
);

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS coffee_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    game_type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    earned_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

const findUser = db.prepare(`
  SELECT * FROM users WHERE name = ?
`);

const createUser = db.prepare(`
  INSERT INTO users (name) VALUES (?)
`);

const addCoffee = db.prepare(`
  INSERT INTO coffee_records
  (user_id, game_type, amount)
  VALUES (?, ?, ?)
`);

const getRecords = db.prepare(`
  SELECT
    coffee_records.id,
    users.name,
    coffee_records.game_type,
    coffee_records.amount,
    coffee_records.earned_at
  FROM coffee_records
  JOIN users ON users.id = coffee_records.user_id
  ORDER BY coffee_records.id DESC
`);

// 사용자 등록
app.post("/api/users", (req, res) => {
  const name = String(req.body.name ?? "").trim();

  if (!name) {
    return res.status(400).json({
      error: "이름을 입력해주세요."
    });
  }

  if (name.length > 30) {
    return res.status(400).json({
      error: "이름은 30자 이하로 입력해주세요."
    });
  }

  let user = findUser.get(name);

  if (!user) {
    const result = createUser.run(name);
    user = {
      id: Number(result.lastInsertRowid),
      name
    };
  }

  res.json({
    id: user.id,
    name: user.name
  });
});

// 커피 획득
app.post("/api/games/complete", (req, res) => {
  const userId = Number(req.body.userId);
  const gameType = String(req.body.gameType ?? "");
  const score = Number(req.body.score);

  if (!Number.isInteger(userId)) {
    return res.status(400).json({
      error: "잘못된 사용자입니다."
    });
  }

  if (!Number.isFinite(score)) {
    return res.status(400).json({
      error: "점수가
