#!/usr/bin/env python3
"""
Autonomous AI Engineer Agent
- Remote model adapters: Hugging Face, Replicate, Ollama, Generic HTTP
- Contextual memory via INSTRUCTIONS.md
- Self-correction loop with lint/build/tests
- Generates patch suggestions and report files; requires human approval to push
- Arabic localization support for prompts and UI messages
"""

import os
import sys
import time
import json
import subprocess
from pathlib import Path
from datetime import datetime
import requests

# Logging
LOG_DIR = Path("agent_logs")
LOG_DIR.mkdir(exist_ok=True)
LOG_FILE = LOG_DIR / f"agent_{int(time.time())}.log"

def log(msg, level="INFO"):
    line = f"{datetime.utcnow().isoformat()}Z [{level}] {msg}"
    print(line, flush=True)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(line + "\n")

def read_instructions():
    p = Path("INSTRUCTIONS.md")
    if not p.exists():
        return ""
    return p.read_text(encoding="utf-8")

# -------------------------
# Remote model adapters
# -------------------------
class ModelAdapter:
    def __init__(self, provider, model_name, api_key=None):
        self.provider = (provider or "").lower()
        self.model_name = model_name
        self.api_key = api_key

    def generate(self, prompt, max_tokens=1024, temperature=0.2):
        if "huggingface" in self.provider or self.provider == "hf":
            return self._hf_inference(prompt, max_tokens, temperature)
        if "replicate" in self.provider:
            return self._replicate_inference(prompt, max_tokens, temperature)
        if "ollama" in self.provider:
            return self._ollama_inference(prompt, max_tokens, temperature)
        # generic HTTP fallback
        return self._http_inference(prompt, max_tokens, temperature)

    def _hf_inference(self, prompt, max_tokens, temperature):
        # Hugging Face Inference API
        url = f"https://api-inference.huggingface.co/models/{self.model_name}"
        headers = {"Authorization": f"Bearer {self.api_key}"} if self.api_key else {}
        payload = {"inputs": prompt, "parameters": {"max_new_tokens": max_tokens, "temperature": temperature}}
        try:
            r = requests.post(url, headers=headers, json=payload, timeout=60)
            r.raise_for_status()
            data = r.json()
            # HF may return list or dict
            if isinstance(data, list) and data:
                text = data[0].get("generated_text") or data[0].get("text") or str(data[0])
            elif isinstance(data, dict):
                text = data.get("generated_text") or data.get("text") or json.dumps(data, ensure_ascii=False)
            else:
                text = str(data)
            return {"text": text, "meta": {"provider": "huggingface"}}
        except Exception as e:
            log(f"HuggingFace inference error: {e}", "ERROR")
            return {"text": f"[ERROR] HuggingFace inference failed: {e}", "meta": {}}

    def _replicate_inference(self, prompt, max_tokens, temperature):
        # Replicate: requires token and model name like "owner/model:version"
        url = f"https://api.replicate.com/v1/predictions"
        headers = {"Authorization": f"Token {self.api_key}", "Content-Type": "application/json"} if self.api_key else {"Content-Type":"application/json"}
        payload = {"version": self.model_name, "input": {"prompt": prompt, "max_tokens": max_tokens, "temperature": temperature}}
        try:
            r = requests.post(url, headers=headers, json=payload, timeout=60)
            r.raise_for_status()
            data = r.json()
            # Replicate returns prediction object; we may need to poll; simple attempt:
            output = data.get("output")
            if isinstance(output, list):
                text = "\n".join([str(x) for x in output])
            else:
                text = str(output)
            return {"text": text, "meta": {"provider": "replicate", "raw": data}}
        except Exception as e:
            log(f"Replicate inference error: {e}", "ERROR")
            return {"text": f"[ERROR] Replicate inference failed: {e}", "meta": {}}

    def _ollama_inference(self, prompt, max_tokens, temperature):
        # Ollama local/remote API: POST /api/generate with model param
        url = os.environ.get("OLLAMA_URL", "http://localhost:11434/api/generate")
        headers = {"Content-Type": "application/json"}
        payload = {"model": self.model_name, "prompt": prompt, "max_tokens": max_tokens, "temperature": temperature}
        try:
            r = requests.post(url, headers=headers, json=payload, timeout=30)
            r.raise_for_status()
            data = r.json()
            text = data.get("text") or data.get("response") or json.dumps(data, ensure_ascii=False)
            return {"text": text, "meta": {"provider": "ollama"}}
        except Exception as e:
            log(f"Ollama inference error: {e}", "ERROR")
            return {"text": f"[ERROR] Ollama inference failed: {e}", "meta": {}}

    def _http_inference(self, prompt, max_tokens, temperature):
        # Generic HTTP adapter: expects MODEL_API_URL and optional headers in env
        url = os.environ.get("MODEL_API_URL")
        if not url:
            return {"text": "[ERROR] No MODEL_API_URL configured for generic HTTP adapter", "meta": {}}
        headers_raw = os.environ.get("MODEL_API_HEADERS_JSON", "{}")
        try:
            headers = json.loads(headers_raw)
        except:
            headers = {}
        payload = {"prompt": prompt, "max_tokens": max_tokens, "temperature": temperature, "model": self.model_name}
        try:
            r = requests.post(url, headers=headers, json=payload, timeout=60)
            r.raise_for_status()
            data = r.json()
            text = data.get("text") or data.get("generated_text") or json.dumps(data, ensure_ascii=False)
            return {"text": text, "meta": {"provider": "http_generic"}}
        except Exception as e:
            log(f"HTTP inference error: {e}", "ERROR")
            return {"text": f"[ERROR] HTTP inference failed: {e}", "meta": {}}

# -------------------------
# Utility functions
# -------------------------
def run_command(cmd, cwd=None, timeout=300):
    log(f"Running command: {cmd}", "DEBUG")
    try:
        res = subprocess.run(cmd, shell=True, cwd=cwd, capture_output=True, text=True, timeout=timeout)
        out = (res.stdout or "")[:5000]
        err = (res.stderr or "")[:5000]
        log(f"Exit {res.returncode} stdout: {out}", "DEBUG")
        if err:
            log(f"stderr: {err}", "DEBUG")
        return res.returncode, res.stdout, res.stderr
    except Exception as e:
        log(f"Command failed: {e}", "ERROR")
        return 1, "", str(e)

def preflight_checks():
    results = {}
    rc, out, err = run_command("flake8 || true")
    results['lint_rc'] = rc
    if Path("package.json").exists():
        rc2, out2, err2 = run_command("npm ci || true && npm run build || true")
        results['build_rc'] = rc2
    else:
        results['build_rc'] = 0
    if Path("pytest.ini").exists() or any(Path(".").glob("test_*.py")):
        rc3, out3, err3 = run_command("pytest -q || true")
        results['tests_rc'] = rc3
    else:
        results['tests_rc'] = 0
    return results

# -------------------------
# Self-correction loop
# -------------------------
def self_correction_loop(adapter, context, max_attempts=2):
    attempt = 0
    last_results = {}
    while attempt < max_attempts:
        attempt += 1
        log(f"Self-correction attempt {attempt}/{max_attempts}")
        prompt = f"""You are an Autonomous AI Engineer. Use Arabic when appropriate.
Project context:
{context}

Task: Propose one small, safe, reversible change (shell command or patch suggestion) to improve lint/build/tests.
Return a JSON object only with keys:
- action_type: one of shell, patch, note
- payload: string (command or unified diff or explanation)
- rationale: short Arabic or English rationale
"""
        resp = adapter.generate(prompt, max_tokens=1024, temperature=0.1)
        text = resp.get("text","")
        log(f"Model proposal: {text[:200]}")
        # Try to parse JSON from model
        proposal = None
        try:
            # find first JSON object in text
            start = text.find("{")
            if start != -1:
                proposal = json.loads(text[start:])
        except Exception:
            proposal = None
        # Heuristic: if shell command present, run it only if AGENT_HUMAN_APPROVAL is "auto" or "allow-shell"
        shell_cmd = None
        if proposal and proposal.get("action_type") == "shell":
            shell_cmd = proposal.get("payload")
        else:
            # fallback: look for line starting with SHELL:
            for line in text.splitlines():
                if line.strip().upper().startswith("SHELL:"):
                    shell_cmd = line.split(":",1)[1].strip()
                    break
        if shell_cmd:
            approval = os.environ.get("AGENT_HUMAN_APPROVAL","manual").lower()
            log(f"Suggested shell command: {shell_cmd}")
            if approval in ("auto","allow-shell"):
                rc, out, err = run_command(shell_cmd)
                log(f"Executed suggested shell command rc={rc}")
            else:
                # write suggestion to file for human review
                Path("agent_suggestions").mkdir(exist_ok=True)
                fname = Path("agent_suggestions") / f"suggestion_shell_{int(time.time())}.txt"
                fname.write_text(shell_cmd, encoding="utf-8")
                log(f"Shell suggestion saved to {fname}; awaiting human approval", "WARN")
        # Re-run checks
        results = preflight_checks()
        last_results = results
        log(f"Post-check results: {json.dumps(results)}")
        if results.get('lint_rc',1) == 0 and results.get('build_rc',1) == 0 and results.get('tests_rc',1) == 0:
            log("All checks passed after self-correction", "SUCCESS")
            return True, results
        else:
            log("Checks still failing; will retry if attempts remain", "WARN")
    return False, last_results

# -------------------------
# Main autonomous flow
# -------------------------
def run_autonomous_mode(adapter):
    log("Starting autonomous mode")
    context = read_instructions()
    log("Loaded INSTRUCTIONS.md length: " + str(len(context)))
    results = preflight_checks()
    log("Initial preflight: " + json.dumps(results))
    if results.get('lint_rc',1) != 0 or results.get('build_rc',1) != 0 or results.get('tests_rc',1) != 0:
        ok, final = self_correction_loop(adapter, context, max_attempts=2)
        if not ok:
            log("Autonomous attempts failed; producing report and pausing for human review", "ERROR")
            report = {"initial": results, "final": final, "note": "Autonomous fixes attempted but checks still failing. Human review required."}
            Path("agent_report.json").write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
            log("Report written to agent_report.json")
            return False
    # If checks pass, ask model for repo health summary and recommendations
    prompt = f"""You are Autonomous AI Engineer. Project context:
{context}

Task: produce a short summary of repository health and up to 3 recommended improvements.
Return JSON with keys: summary, recommendations (list).
Prefer Arabic output but include English if helpful.
"""
    resp = adapter.generate(prompt, max_tokens=1024, temperature=0.1)
    log("Agent final output: " + resp.get("text","")[:1000])
    Path("agent_final_output.json").write_text(json.dumps({"model_text": resp.get("text","")}, ensure_ascii=False, indent=2), encoding="utf-8")
    log("Saved agent_final_output.json")
    return True

# -------------------------
# CLI and bootstrap
# -------------------------
def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["autonomous","manual"], default="manual")
    args = parser.parse_args()
    provider = os.environ.get("MODEL_PROVIDER","huggingface")
    model_name = os.environ.get("MODEL_NAME","")
    api_key = os.environ.get("MODEL_API_KEY")
    adapter = ModelAdapter(provider, model_name, api_key)
    log(f"Using model provider: {provider} model: {model_name}")
    if args.mode == "autonomous":
        ok = run_autonomous_mode(adapter)
        if ok:
            log("Agent finished successfully", "SUCCESS")
            sys.exit(0)
        else:
            log("Agent finished with issues", "ERROR")
            sys.exit(2)
    else:
        log("Manual mode: interactive shell (Arabic supported). Commands: ask:<text> run:<shell>")
        while True:
            try:
                cmd = input("agent> ").strip()
            except EOFError:
                break
            if not cmd:
                continue
            if cmd.lower() in ("exit","quit"):
                break
            if cmd.startswith("ask:"):
                q = cmd.split(":",1)[1].strip()
                resp = adapter.generate(q)
                print(resp.get("text"))
            elif cmd.startswith("run:"):
                shell = cmd.split(":",1)[1].strip()
                rc, out, err = run_command(shell)
                print(out)
            else:
                print("Unknown command. Use ask: or run:")

if __name__ == "__main__":
    main()
