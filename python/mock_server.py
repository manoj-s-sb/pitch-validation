import json
import re
import socket
import argparse
from http.server import BaseHTTPRequestHandler, HTTPServer
import urllib.parse

status_data = {
    "facility": "Houston (HOU01)",
    "lanes": {
        "Lane 1": {
            "healthy": True,
            "laneId": 1,
            "resources": {
                "bowlingMC": {"checkedAt": "2026-04-14T04:24:22-05:00", "description": "USB device present: /dev/ttyUSB0", "since": "2026-02-10T22:36:20-06:00", "status": "online"},
                "display": {"checkedAt": "2026-04-14T04:24:22-05:00", "description": "HDMI connected: card1-HDMI-A-1", "since": "2026-03-12T15:44:01-05:00", "status": "online"},
                "lbaCamera": {"checkedAt": "2026-04-14T04:24:22-05:00", "description": "Power: 12200mV (AC)", "since": "2026-01-14T16:52:58-06:00", "status": "online"},
                "miniPC": {"checkedAt": "2026-04-14T04:24:22-05:00", "description": "SSH connection successful", "since": "2026-01-14T16:52:58-06:00", "status": "online"},
                "rbaCamera": {"checkedAt": "2026-04-14T04:24:22-05:00", "description": "Power: 12200mV (AC)", "since": "2026-04-13T11:33:17-05:00", "status": "online"}
            }
        },
        "Lane 2": {
            "healthy": True,
            "laneId": 2,
            "resources": {
                "bowlingMC": {"checkedAt": "2026-04-14T04:24:22-05:00", "description": "USB device present: /dev/ttyUSB0", "since": "2026-02-10T23:22:02-06:00", "status": "online"},
                "display": {"checkedAt": "2026-04-14T04:24:22-05:00", "description": "HDMI connected: card1-HDMI-A-1", "since": "2026-02-10T23:22:02-06:00", "status": "online"},
                "lbaCamera": {"checkedAt": "2026-04-14T04:24:22-05:00", "description": "Power: 12100mV (AC)", "since": "2026-04-13T11:34:23-05:00", "status": "online"},
                "miniPC": {"checkedAt": "2026-04-14T04:24:22-05:00", "description": "SSH connection successful", "since": "2026-02-10T23:22:02-06:00", "status": "online"},
                "rbaCamera": {"checkedAt": "2026-04-14T04:24:22-05:00", "description": "Power: 12000mV (AC)", "since": "2026-01-14T16:52:58-06:00", "status": "online"}
            }
        },
        "Lane 3": {
            "healthy": True,
            "laneId": 3,
            "resources": {
                "bowlingMC": {"checkedAt": "2026-04-14T04:24:22-05:00", "description": "USB device present: /dev/ttyUSB0", "since": "2026-02-10T22:31:39-06:00", "status": "online"},
                "display": {"checkedAt": "2026-04-14T04:24:22-05:00", "description": "HDMI connected: card1-HDMI-A-1", "since": "2026-02-11T17:34:40-06:00", "status": "online"},
                "lbaCamera": {"checkedAt": "2026-04-14T04:24:22-05:00", "description": "Power: 12100mV (AC)", "since": "2026-01-14T16:52:58-06:00", "status": "online"},
                "miniPC": {"checkedAt": "2026-04-14T04:24:22-05:00", "description": "SSH connection successful", "since": "2026-01-14T16:52:58-06:00", "status": "online"},
                "rbaCamera": {"checkedAt": "2026-04-14T04:24:22-05:00", "description": "Power: 12200mV (AC)", "since": "2026-01-14T16:52:58-06:00", "status": "online"}
            }
        },
        "Lane 4": {
            "healthy": True,
            "laneId": 4,
            "resources": {
                "bowlingMC": {"checkedAt": "2026-04-14T04:24:16-05:00", "description": "USB device present: /dev/ttyUSB0", "since": "2026-03-18T00:36:10-05:00", "status": "online"},
                "display": {"checkedAt": "2026-04-14T04:24:16-05:00", "description": "HDMI connected: card1-HDMI-A-1", "since": "2026-03-18T00:36:10-05:00", "status": "online"},
                "lbaCamera": {"checkedAt": "2026-04-14T04:24:16-05:00", "description": "Power: 12100mV (AC)", "since": "2026-01-14T16:52:32-06:00", "status": "online"},
                "miniPC": {"checkedAt": "2026-04-14T04:24:16-05:00", "description": "SSH connection successful", "since": "2026-03-18T00:34:56-05:00", "status": "online"},
                "rbaCamera": {"checkedAt": "2026-04-14T04:24:16-05:00", "description": "Power: 12100mV (AC)", "since": "2026-01-14T16:52:32-06:00", "status": "online"}
            }
        },
        "Lane 5": {
            "healthy": True,
            "laneId": 5,
            "resources": {
                "bowlingMC": {"checkedAt": "2026-04-14T04:24:16-05:00", "description": "USB device present: /dev/ttyUSB0", "since": "2026-03-05T05:38:57-06:00", "status": "online"},
                "display": {"checkedAt": "2026-04-14T04:24:16-05:00", "description": "HDMI connected: card1-HDMI-A-1", "since": "2026-03-05T05:38:57-06:00", "status": "online"},
                "lbaCamera": {"checkedAt": "2026-04-14T04:24:16-05:00", "description": "Power: 12100mV (AC)", "since": "2026-01-14T16:52:32-06:00", "status": "online"},
                "miniPC": {"checkedAt": "2026-04-14T04:24:16-05:00", "description": "SSH connection successful", "since": "2026-03-05T05:38:57-06:00", "status": "online"},
                "rbaCamera": {"checkedAt": "2026-04-14T04:24:16-05:00", "description": "Power: 12200mV (AC)", "since": "2026-01-14T16:52:32-06:00", "status": "online"}
            }
        },
        "Lane 6": {
            "healthy": True,
            "laneId": 6,
            "resources": {
                "bowlingMC": {"checkedAt": "2026-04-14T04:24:22-05:00", "description": "USB device present: /dev/ttyUSB0", "since": "2026-02-10T23:23:13-06:00", "status": "online"},
                "display": {"checkedAt": "2026-04-14T04:24:22-05:00", "description": "HDMI connected: card1-HDMI-A-1", "since": "2026-02-10T23:23:13-06:00", "status": "online"},
                "lbaCamera": {"checkedAt": "2026-04-14T04:24:22-05:00", "description": "Power: 12200mV (AC)", "since": "2026-01-15T16:04:33-06:00", "status": "online"},
                "miniPC": {"checkedAt": "2026-04-14T04:24:22-05:00", "description": "SSH connection successful", "since": "2026-02-10T23:23:13-06:00", "status": "online"},
                "rbaCamera": {"checkedAt": "2026-04-14T04:24:22-05:00", "description": "Power: 12000mV (AC)", "since": "2026-01-14T16:52:58-06:00", "status": "online"}
            }
        },
        "Lane 6b": {
            "healthy": True,
            "laneId": 0,
            "resources": {
                "display": {"checkedAt": "2026-04-14T04:24:22-05:00", "description": "HDMI connected: card0-HDMI-A-1", "since": "2026-04-01T09:17:52-05:00", "status": "online"},
                "lboCamera": {"checkedAt": "2026-04-14T04:24:22-05:00", "description": "Power: 12100mV (AC)", "since": "2026-01-14T16:52:58-06:00", "status": "online"},
                "miniPC": {"checkedAt": "2026-04-14T04:24:22-05:00", "description": "SSH connection successful", "since": "2026-04-01T01:14:21-05:00", "status": "online"},
                "rboCamera": {"checkedAt": "2026-04-14T04:24:22-05:00", "description": "Power: 12200mV (AC)", "since": "2026-01-15T15:42:59-06:00", "status": "online"}
            }
        },
        "Lane 7": {
            "healthy": True,
            "laneId": 7,
            "resources": {
                "bowlingMC": {"checkedAt": "2026-04-14T04:24:16-05:00", "description": "USB device present: /dev/ttyUSB0", "since": "2026-02-23T01:19:06-06:00", "status": "online"},
                "display": {"checkedAt": "2026-04-14T04:24:16-05:00", "description": "HDMI connected: card1-HDMI-A-1", "since": "2026-02-10T23:24:58-06:00", "status": "online"},
                "lbaCamera": {"checkedAt": "2026-04-14T04:24:16-05:00", "description": "Power: 12100mV (AC)", "since": "2026-01-14T16:52:32-06:00", "status": "online"},
                "miniPC": {"checkedAt": "2026-04-14T04:24:16-05:00", "description": "SSH connection successful", "since": "2026-02-10T23:24:58-06:00", "status": "online"},
                "rbaCamera": {"checkedAt": "2026-04-14T04:24:16-05:00", "description": "Power: 12100mV (AC)", "since": "2026-01-14T16:52:32-06:00", "status": "online"}
            }
        },
        "Lane 7b": {
            "healthy": True,
            "laneId": 0,
            "resources": {
                "display": {"checkedAt": "2026-04-14T04:24:16-05:00", "description": "HDMI connected: card0-HDMI-A-1", "since": "2026-04-08T09:12:09-05:00", "status": "online"},
                "lboCamera": {"checkedAt": "2026-04-14T04:24:16-05:00", "description": "Power: 12100mV (AC)", "since": "2026-01-14T16:52:32-06:00", "status": "online"},
                "miniPC": {"checkedAt": "2026-04-14T04:24:16-05:00", "description": "SSH connection successful", "since": "2026-04-08T09:12:09-05:00", "status": "online"},
                "rboCamera": {"checkedAt": "2026-04-14T04:24:16-05:00", "description": "Power: 12100mV (AC)", "since": "2026-03-19T00:04:57-05:00", "status": "online"}
            }
        }
    },
    "lastSummary": "2026-04-14T04:00:39-05:00",
    "timestamp": "2026-04-14T04:24:32-05:00"
}

class RequestHandler(BaseHTTPRequestHandler):
    def _set_headers(self, status_code=200):
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json')
        # Add CORS headers so a React/frontend app can successfully fetch data
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers(200)

    def do_GET(self):
        path = urllib.parse.urlparse(self.path).path

        if path == '/health':
            self._set_headers()
            response = {
                "facility": "Houston (HOU01)",
                "status": "healthy",
                "timestamp": "2026-04-14T04:23:20-05:00"
            }
            self.wfile.write(json.dumps(response).encode('utf-8'))
            return

        if path == '/status':
            self._set_headers()
            self.wfile.write(json.dumps(status_data).encode('utf-8'))
            return

        # Match single lane status api endpoint (e.g., /1/status or /6b/status)
        match = re.match(r'^/([^/]+)/status$', path)
        if match:
            lane_id = urllib.parse.unquote(match.group(1))
            lane_key = f"Lane {lane_id}"

            # Check if key doesn't format correctly using just f"Lane {id}"
            if lane_key not in status_data["lanes"]:
                # Sometimes user might query straight with "Lane 1"
                if lane_id in status_data["lanes"]:
                    lane_key = lane_id

            if lane_key in status_data["lanes"]:
                lane_info = status_data["lanes"][lane_key]
                self._set_headers()
                response = {
                    "facility": "Houston (HOU01)",
                    "healthy": lane_info["healthy"],
                    "lane": lane_key,
                    "laneId": lane_info["laneId"],
                    "resources": lane_info["resources"],
                    "timestamp": "2026-04-14T04:25:47-05:00"
                }
                self.wfile.write(json.dumps(response).encode('utf-8'))
            else:
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "Lane not found"}).encode('utf-8'))
            return

        # Fallback if no paths matched
        self._set_headers(404)
        self.wfile.write(json.dumps({"error": "Endpoint not found"}).encode('utf-8'))


def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def run(server_class=HTTPServer, handler_class=RequestHandler, host='', port=8080):
    server_address = (host, port)
    httpd = server_class(server_address, handler_class)

    display_host = host if (host and host != '0.0.0.0') else get_local_ip()

    print(f"Mock server starting on {display_host}:{port}...")
    print(f"Test endpoints:")
    print(f"  - http://{display_host}:{port}/health")
    print(f"  - http://{display_host}:{port}/status")
    print(f"  - http://{display_host}:{port}/1/status")
    print(f"  - http://{display_host}:{port}/6b/status")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
        httpd.server_close()

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Mock API Server")
    parser.add_argument('--host', type=str, default='0.0.0.0', help='Host to bind to (default: 0.0.0.0)')
    parser.add_argument('--port', type=int, default=8080, help='Port to bind to (default: 8080)')
    args = parser.parse_args()

    run(host=args.host, port=args.port)
