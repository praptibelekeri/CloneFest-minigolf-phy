// src/ui.js
export function updateHUDStroke(n) {
  const el = document.getElementById('strokes');
  if (el) el.innerText = 'Strokes: ' + n;
}
export function updateHUDHole(holeNum, par) {
  const h = document.getElementById('hole');
  const p = document.getElementById('par');
  if (h) h.innerText = 'Hole: ' + holeNum;
  if (p) p.innerText = 'Par: ' + par;
}
export function updatePowerUI(power, maxPower=1) {
  const f = document.getElementById('powerfill');
  if (!f) return;
  const pct = Math.round((power / (maxPower || 1)) * 100);
  f.style.width = Math.min(100, Math.max(0, pct)) + '%';
}
export function showHoleComplete(strokes) {
  const overlay = document.getElementById('completeOverlay');
  const text = document.getElementById('completeText');
  if (!overlay || !text) return;
  text.innerText = `Hole completed in ${strokes} strokes`;
  overlay.style.display = 'flex';
}
export function hideHoleComplete() {
  const overlay = document.getElementById('completeOverlay');
  if (!overlay) return;
  overlay.style.display = 'none';
}
export function showStartScreen() {
  const s = document.getElementById('startOverlay');
  if (s) s.style.display = 'flex';
}
export function hideStartScreen() {
  const s = document.getElementById('startOverlay');
  if (s) s.style.display = 'none';
}
export function updateBestText(msg) {
  const el = document.getElementById('bestText');
  if (el) el.innerText = msg || '';
}
