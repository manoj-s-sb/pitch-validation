import json
import os
import re
import socket
import argparse
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, HTTPServer
import urllib.parse

# ── Load mock data from data.json (same directory as this file) ──────────────
DATA_FILE = os.path.join(os.path.dirname(__file__), 'data.json')

def load_data():
    with open(DATA_FILE, 'r') as f:
        return json.load(f)

status_data = load_data()

# ─────────────────────────────────────────────────────────────────────────────

class RequestHandler(BaseHTTPRequestHandler):
    def _set_headers(self, status_code=200):
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def _now(self):
        return datetime.now(timezone.utc).astimezone().isoformat()

    def do_OPTIONS(self):
        self._set_headers(200)

    def do_GET(self):
        # Reload data on every request so edits to data.json are reflected live
        global status_data
        status_data = load_data()

        path = urllib.parse.urlparse(self.path).path

        # GET /health
        if path == '/health':
            self._set_headers()
            response = {
                "facility": status_data["facility"],
                "status": "healthy",
                "timestamp": self._now()
            }
            self.wfile.write(json.dumps(response).encode('utf-8'))
            return

        # GET /status
        if path == '/status':
            self._set_headers()
            payload = dict(status_data)
            payload["timestamp"] = self._now()
            payload["totalLanes"] = len(status_data["lanes"])
            self.wfile.write(json.dumps(payload).encode('utf-8'))
            return

        # GET /<laneId>/status  (e.g. /1/status or /6b/status)
        match = re.match(r'^/([^/]+)/status$', path)
        if match:
            lane_id  = urllib.parse.unquote(match.group(1))
            lane_key = f"Lane {lane_id}"

            if lane_key not in status_data["lanes"] and lane_id in status_data["lanes"]:
                lane_key = lane_id

            if lane_key in status_data["lanes"]:
                lane_info = status_data["lanes"][lane_key]
                self._set_headers()
                response = {
                    "facility": status_data["facility"],
                    "lane":     lane_key,
                    "laneId":   lane_info["laneId"],
                    "healthy":  lane_info["healthy"],
                    "resources": lane_info["resources"],
                    "timestamp": self._now()
                }
                self.wfile.write(json.dumps(response).encode('utf-8'))
            else:
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": f"Lane '{lane_key}' not found"}).encode('utf-8'))
            return

        # 404 fallback
        self._set_headers(404)
        self.wfile.write(json.dumps({"error": "Endpoint not found"}).encode('utf-8'))

    def log_message(self, fmt, *args):
        print(f"[{self._now()}] {fmt % args}")


def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


def run(host='0.0.0.0', port=8080):
    httpd = HTTPServer((host, port), RequestHandler)
    display_host = host if (host and host != '0.0.0.0') else get_local_ip()

    print(f"Mock server running  →  http://{display_host}:{port}")
    print(f"Data file            →  {DATA_FILE}")
    print(f"Endpoints:")
    print(f"  GET http://{display_host}:{port}/health")
    print(f"  GET http://{display_host}:{port}/status")
    print(f"  GET http://{display_host}:{port}/1/status")
    print(f"  GET http://{display_host}:{port}/6b/status")
    print()

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
        httpd.server_close()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Mock API Server")
    parser.add_argument('--host', type=str, default='0.0.0.0')
    parser.add_argument('--port', type=int, default=8080)
    args = parser.parse_args()
    run(host=args.host, port=args.port)
