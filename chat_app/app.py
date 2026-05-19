from fastapi import FastAPI, WebSocket, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from jinja2 import Template
from pathlib import Path
import json

app = FastAPI()
ROOT = Path(__file__).parent
app.mount("/static", StaticFiles(directory=ROOT / "static"), name="static")

INDEX = ROOT / "templates" / "index.html"

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    html = INDEX.read_text(encoding="utf-8")
    return HTMLResponse(html)

# Simple WebSocket for UI to send commands and receive logs
clients = set()

@app.websocket("/ws")
async def websocket_endpoint(ws):
    await ws.accept()
    clients.add(ws)
    try:
        while True:
            data = await ws.receive_text()
            # Expect JSON: {"type":"command","payload":"ask: ..."}
            try:
                msg = json.loads(data)
            except:
                msg = {"type":"raw","payload":data}
            # Echo back for now; UI will display and optionally call agent via CLI on the runner
            await ws.send_text(json.dumps({"type":"ack","payload":msg}, ensure_ascii=False))
    except Exception:
        clients.remove(ws)
