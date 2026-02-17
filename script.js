const audio = document.getElementById("audio");
const record = document.getElementById("record");

let spinning = false;
let rafId = null;

let lastSpinAt = 0;
const STOP_AFTER_MS = 650;

let center = { x: 0, y: 0 };
let lastAngle = null;
let spinSpeed = 0;

function updateCenter() {
  const rect = record.getBoundingClientRect();
  center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function angleFromCenter(x, y) {
  return Math.atan2(y - center.y, x - center.x);
}

function smallestAngleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function startSpin() {
  if (spinning) return;
  spinning = true;

  audio.play().catch(() => {});
  lastSpinAt = Date.now();

  const tick = () => {
    if (!spinning) return;

    const currentRotation = (Number(record.dataset.rot) || 0) + spinSpeed * 12;
    record.dataset.rot = String(currentRotation);
    record.style.transform = `rotate(${currentRotation}deg)`;

    spinSpeed *= 0.92;

    if (Date.now() - lastSpinAt > STOP_AFTER_MS) {
      stopSpin();
      return;
    }

    rafId = requestAnimationFrame(tick);
  };

  rafId = requestAnimationFrame(tick);
}

function stopSpin() {
  spinning = false;
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
  audio.pause();
  lastAngle = null;
  spinSpeed = 0;
}

record.addEventListener("pointerdown", (e) => {
  updateCenter();
  record.setPointerCapture(e.pointerId);
  lastAngle = angleFromCenter(e.clientX, e.clientY);
  startSpin();
});

record.addEventListener("pointermove", (e) => {
  if (!spinning || lastAngle === null) return;

  const a = angleFromCenter(e.clientX, e.clientY);
  const diff = smallestAngleDiff(a, lastAngle);
  const absDiff = Math.abs(diff);

  if (absDiff > 0.02) {
    spinSpeed = Math.min(2.8, spinSpeed + absDiff * 2.2);
    lastSpinAt = Date.now();
    lastAngle = a;
  }
});

record.addEventListener("pointerup", stopSpin);
record.addEventListener("pointercancel", stopSpin);

window.addEventListener("resize", updateCenter);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopSpin();
});
window.addEventListener("blur", stopSpin);
