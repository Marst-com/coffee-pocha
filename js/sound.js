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
function tone(f, d = 0.1, type = "sine", v = 0.15, when = 0) {
  if (!ac || muted) return;
  const t = ac.currentTime + when;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  g.gain.setValueAtTime(v, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g).connect(ac.destination);
  o.start(t);
  o.stop(t + d + 0.02);
}
export const sfx = {
  tap: () => tone(520, 0.05, "square", 0.07),
  good: () => { tone(660, 0.08, "triangle"); tone(990, 0.1, "triangle", 0.15, 0.07); },
  bad: () => tone(180, 0.2, "sawtooth", 0.12),
  tick: () => tone(440, 0.08, "sine", 0.12),
  win: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.18, "triangle", 0.16, i * 0.1)),
  lose: () => [392, 330, 262].forEach((f, i) => tone(f, 0.22, "sine", 0.14, i * 0.14)),
};
