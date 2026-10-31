"use strict";
/* ══════════════ 暫停 ══════════════ */
function canPause(){
  return G.phase === 'prep' || G.phase === 'tsunami' || G.phase === 'drain';
}
function togglePause(force){
  if(!canPause()) return;
  G.paused = force !== undefined ? force : !G.paused;
  document.getElementById('pauseBtn').textContent = G.paused ? '▶' : '⏸';
  app.classList.toggle('paused', G.paused);
  hideTip();
}
document.getElementById('pauseBtn').onclick = () => togglePause();
document.addEventListener('visibilitychange', () => {
  if(document.hidden) togglePause(true);
});
