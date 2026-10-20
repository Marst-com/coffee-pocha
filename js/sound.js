let ac = null;
let muted = false;
try { muted = localStorage.getItem("cp_mute") === "1"; } catch {}
export const isMuted = () => muted;
export function setMuted(v) { muted = !!v; try { localStorage.setItem("cp_mute", muted ? "1" : "0"); } catch {} }

export function unlock() {
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    if (ac.state === "suspended") ac.resume();
  } catch {}
}
function tone(f, d = 0.1, type = "square", v = 0.07, when = 0, slideTo = null) {
  if (!ac || muted) return;
  const t = ac.currentTime + when;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + d);
  g.gain.setValueAtTime(v, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g).connect(ac.destination);
  o.start(t);
  o.stop(t + d + 0.02);
}
// 오락실 효과음: 사각파 + 짧은 아르페지오
export const sfx = {
  tap: () => tone(660, 0.04, "square", 0.05),
  good: () => { tone(988, 0.06); tone(1319, 0.12, "square", 0.07, 0.06); },          // 코인 먹는 소리
  bad: () => tone(220, 0.22, "sawtooth", 0.08, 0, 70),
  tick: () => tone(523, 0.1, "square", 0.06),
  shoot: () => tone(1200, 0.08, "square", 0.035, 0, 300),
  start: () => [262, 330, 392, 523].forEach((f, i) => tone(f, 0.08, "square", 0.06, i * 0.07)),
  win: () => [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => tone(f, 0.13, "square", 0.07, i * 0.09)),
  lose: () => [392, 330, 262, 196].forEach((f, i) => tone(f, 0.2, "square", 0.07, i * 0.16)),
};
