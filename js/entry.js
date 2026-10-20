// 기록(이름 + 소감) 저장
export const NAME_MAX = 12;
export const NOTE_MAX = 40;

export async function addEntry(db, { name, note, game, gameId, score, goal }) {
  const e = {
    name: String(name).trim().slice(0, NAME_MAX),
    note: String(note).trim().slice(0, NOTE_MAX),
    game, gameId, score, goal,
    createdAt: Date.now(),
  };
  return db.add(e);
}
