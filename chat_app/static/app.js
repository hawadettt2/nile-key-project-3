const logEl = document.getElementById("log");
const ws = new WebSocket(`ws://${location.host}/ws`);
ws.onopen = ()=> appendLog("system","تم الاتصال بواجهة الوكيل");
ws.onmessage = (e)=> {
  const d = JSON.parse(e.data);
  appendLog(d.type, JSON.stringify(d.payload));
};
function appendLog(type, text){
  const div = document.createElement("div");
  div.className = "entry";
  div.innerHTML = `<strong>${type}</strong>: <span>${escapeHtml(text)}</span>`;
  logEl.appendChild(div);
  logEl.scrollTop = logEl.scrollHeight;
}
function escapeHtml(s){ return s.replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }

document.getElementById("send").onclick = ()=>{
  const provider = document.getElementById("provider").value;
  const model = document.getElementById("model").value;
  const cmd = document.getElementById("cmd").value;
  const payload = {type:"command", payload:{provider, model, cmd}};
  ws.send(JSON.stringify(payload));
  appendLog("out", JSON.stringify(payload));
  document.getElementById("cmd").value = "";
};
document.getElementById("open-logs").onclick = ()=> {
  fetch("/static/").then(()=> appendLog("ui","استخدم واجهة Runner لعرض agent_logs/ على الخادم"));
};
