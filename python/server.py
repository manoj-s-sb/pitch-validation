"""
NOC Dummy API Server
Endpoints:
  GET /health        → facility health summary
  GET /status        → all lanes status
  GET /{laneId}/status → single lane status

Run:
  pip install flask flask-cors
  python server.py
"""

from flask import Flask, jsonify
from flask_cors import CORS
from datetime import datetime, timezone, timedelta

app = Flask(__name__)
CORS(app)  # allow requests from the React dev server

# ─── Static data ──────────────────────────────────────────────────────────────

FACILITY = "Houston (HOU01)"

LANES = {
    "Lane 1": {
        "healthy": True,
        "laneId": 1,
        "resources": {
            "bowlingMC": {
                "checkedAt": "2026-04-14T04:24:22-05:00",
                "description": "USB device present: /dev/ttyUSB0",
                "since": "2026-02-10T22:36:20-06:00",
                "status": "online",
            },
            "display": {
                "checkedAt": "2026-04-14T04:24:22-05:00",
                "description": "HDMI connected: card1-HDMI-A-1",
                "since": "2026-03-12T15:44:01-05:00",
                "status": "online",
            },
            "lbaCamera": {
                "checkedAt": "2026-04-14T04:24:22-05:00",
                "description": "Power: 12200mV (AC)",
                "since": "2026-01-14T16:52:58-06:00",
                "status": "online",
            },
            "miniPC": {
                "checkedAt": "2026-04-14T04:24:22-05:00",
                "description": "SSH connection successful",
                "since": "2026-01-14T16:52:58-06:00",
                "status": "online",
            },
            "rbaCamera": {
                "checkedAt": "2026-04-14T04:24:22-05:00",
                "description": "Power: 12200mV (AC)",
                "since": "2026-04-13T11:33:17-05:00",
                "status": "online",
            },
        },
    },
    "Lane 2": {
        "healthy": True,
        "laneId": 2,
        "resources": {
            "bowlingMC": {
                "checkedAt": "2026-04-14T04:24:22-05:00",
                "description": "USB device present: /dev/ttyUSB0",
                "since": "2026-02-10T23:22:02-06:00",
                "status": "online",
            },
            "display": {
                "checkedAt": "2026-04-14T04:24:22-05:00",
                "description": "HDMI connected: card1-HDMI-A-1",
                "since": "2026-02-10T23:22:02-06:00",
                "status": "online",
            },
            "lbaCamera": {
                "checkedAt": "2026-04-14T04:24:22-05:00",
                "description": "Power: 12100mV (AC)",
                "since": "2026-04-13T11:34:23-05:00",
                "status": "online",
            },
            "miniPC": {
                "checkedAt": "2026-04-14T04:24:22-05:00",
                "description": "SSH connection successful",
                "since": "2026-02-10T23:22:02-06:00",
                "status": "online",
            },
            "rbaCamera": {
                "checkedAt": "2026-04-14T04:24:22-05:00",
                "description": "Power: 12000mV (AC)",
                "since": "2026-01-14T16:52:58-06:00",
                "status": "online",
            },
        },
    },
    "Lane 3": {
        "healthy": True,
        "laneId": 3,
        "resources": {
            "bowlingMC": {
                "checkedAt": "2026-04-14T04:24:22-05:00",
                "description": "USB device present: /dev/ttyUSB0",
                "since": "2026-02-10T22:31:39-06:00",
                "status": "online",
            },
            "display": {
                "checkedAt": "2026-04-14T04:24:22-05:00",
                "description": "HDMI connected: card1-HDMI-A-1",
                "since": "2026-02-11T17:34:40-06:00",
                "status": "online",
            },
            "lbaCamera": {
                "checkedAt": "2026-04-14T04:24:22-05:00",
                "description": "Power: 12100mV (AC)",
                "since": "2026-01-14T16:52:58-06:00",
                "status": "online",
            },
            "miniPC": {
                "checkedAt": "2026-04-14T04:24:22-05:00",
                "description": "SSH connection successful",
                "since": "2026-01-14T16:52:58-06:00",
                "status": "online",
            },
            "rbaCamera": {
                "checkedAt": "2026-04-14T04:24:22-05:00",
                "description": "Power: 12200mV (AC)",
                "since": "2026-01-14T16:52:58-06:00",
                "status": "online",
            },
        },
    },
    "Lane 4": {
        "healthy": True,
        "laneId": 4,
        "resources": {
            "bowlingMC": {
                "checkedAt": "2026-04-14T04:24:16-05:00",
                "description": "USB device present: /dev/ttyUSB0",
                "since": "2026-03-18T00:36:10-05:00",
                "status": "online",
            },
            "display": {
                "checkedAt": "2026-04-14T04:24:16-05:00",
                "description": "HDMI connected: card1-HDMI-A-1",
                "since": "2026-03-18T00:36:10-05:00",
                "status": "online",
            },
            "lbaCamera": {
                "checkedAt": "2026-04-14T04:24:16-05:00",
                "description": "Power: 12100mV (AC)",
                "since": "2026-01-14T16:52:32-06:00",
                "status": "online",
            },
            "miniPC": {
                "checkedAt": "2026-04-14T04:24:16-05:00",
                "description": "SSH connection successful",
                "since": "2026-03-18T00:34:56-05:00",
                "status": "online",
            },
            "rbaCamera": {
                "checkedAt": "2026-04-14T04:24:16-05:00",
                "description": "Power: 12100mV (AC)",
                "since": "2026-01-14T16:52:32-06:00",
                "status": "online",
            },
        },
    },
    "Lane 5": {
        "healthy": True,
        "laneId": 5,
        "resources": {
            "bowlingMC": {
                "checkedAt": "2026-04-14T04:24:16-05:00",
                "description": "USB device present: /dev/ttyUSB0",
                "since": "2026-03-05T05:38:57-06:00",
                "status": "online",
            },
            "display": {
                "checkedAt": "2026-04-14T04:24:16-05:00",
                "description": "HDMI connected: card1-HDMI-A-1",
                "since": "2026-03-05T05:38:57-06:00",
                "status": "online",
            },
            "lbaCamera": {
                "checkedAt": "2026-04-14T04:24:16-05:00",
                "description": "Power: 12100mV (AC)",
                "since": "2026-01-14T16:52:32-06:00",
                "status": "online",
            },
            "miniPC": {
                "checkedAt": "2026-04-14T04:24:16-05:00",
                "description": "SSH connection successful",
                "since": "2026-03-05T05:38:57-06:00",
                "status": "online",
            },
            "rbaCamera": {
                "checkedAt": "2026-04-14T04:24:16-05:00",
                "description": "Power: 12200mV (AC)",
                "since": "2026-01-14T16:52:32-06:00",
                "status": "online",
            },
        },
    },
    "Lane 6": {
        "healthy": True,
        "laneId": 6,
        "resources": {
            "bowlingMC": {
                "checkedAt": "2026-04-14T04:24:22-05:00",
                "description": "USB device present: /dev/ttyUSB0",
                "since": "2026-02-10T23:23:13-06:00",
                "status": "online",
            },
            "display": {
                "checkedAt": "2026-04-14T04:24:22-05:00",
                "description": "HDMI connected: card1-HDMI-A-1",
                "since": "2026-02-10T23:23:13-06:00",
                "status": "online",
            },
            "lbaCamera": {
                "checkedAt": "2026-04-14T04:24:22-05:00",
                "description": "Power: 12200mV (AC)",
                "since": "2026-01-15T16:04:33-06:00",
                "status": "online",
            },
            "miniPC": {
                "checkedAt": "2026-04-14T04:24:22-05:00",
                "description": "SSH connection successful",
                "since": "2026-02-10T23:23:13-06:00",
                "status": "online",
            },
            "rbaCamera": {
                "checkedAt": "2026-04-14T04:24:22-05:00",
                "description": "Power: 12000mV (AC)",
                "since": "2026-01-14T16:52:58-06:00",
                "status": "online",
            },
        },
    },
    "Lane 6b": {
        "healthy": True,
        "laneId": 0,
        "resources": {
            "display": {
                "checkedAt": "2026-04-14T04:24:22-05:00",
                "description": "HDMI connected: card0-HDMI-A-1",
                "since": "2026-04-01T09:17:52-05:00",
                "status": "online",
            },
            "lboCamera": {
                "checkedAt": "2026-04-14T04:24:22-05:00",
                "description": "Power: 12100mV (AC)",
                "since": "2026-01-14T16:52:58-06:00",
                "status": "online",
            },
            "miniPC": {
                "checkedAt": "2026-04-14T04:24:22-05:00",
                "description": "SSH connection successful",
                "since": "2026-04-01T01:14:21-05:00",
                "status": "online",
            },
            "rboCamera": {
                "checkedAt": "2026-04-14T04:24:22-05:00",
                "description": "Power: 12200mV (AC)",
                "since": "2026-01-15T15:42:59-06:00",
                "status": "online",
            },
        },
    },
    "Lane 7": {
        "healthy": True,
        "laneId": 7,
        "resources": {
            "bowlingMC": {
                "checkedAt": "2026-04-14T04:24:16-05:00",
                "description": "USB device present: /dev/ttyUSB0",
                "since": "2026-02-23T01:19:06-06:00",
                "status": "online",
            },
            "display": {
                "checkedAt": "2026-04-14T04:24:16-05:00",
                "description": "HDMI connected: card1-HDMI-A-1",
                "since": "2026-02-10T23:24:58-06:00",
                "status": "online",
            },
            "lbaCamera": {
                "checkedAt": "2026-04-14T04:24:16-05:00",
                "description": "Power: 12100mV (AC)",
                "since": "2026-01-14T16:52:32-06:00",
                "status": "online",
            },
            "miniPC": {
                "checkedAt": "2026-04-14T04:24:16-05:00",
                "description": "SSH connection successful",
                "since": "2026-02-10T23:24:58-06:00",
                "status": "online",
            },
            "rbaCamera": {
                "checkedAt": "2026-04-14T04:24:16-05:00",
                "description": "Power: 12100mV (AC)",
                "since": "2026-01-14T16:52:32-06:00",
                "status": "online",
            },
        },
    },
    "Lane 7b": {
        "healthy": True,
        "laneId": 0,
        "resources": {
            "display": {
                "checkedAt": "2026-04-14T04:24:16-05:00",
                "description": "HDMI connected: card0-HDMI-A-1",
                "since": "2026-04-08T09:12:09-05:00",
                "status": "online",
            },
            "lboCamera": {
                "checkedAt": "2026-04-14T04:24:16-05:00",
                "description": "Power: 12100mV (AC)",
                "since": "2026-01-14T16:52:32-06:00",
                "status": "online",
            },
            "miniPC": {
                "checkedAt": "2026-04-14T04:24:16-05:00",
                "description": "SSH connection successful",
                "since": "2026-04-08T09:12:09-05:00",
                "status": "online",
            },
            "rboCamera": {
                "checkedAt": "2026-04-14T04:24:16-05:00",
                "description": "Power: 12100mV (AC)",
                "since": "2026-03-19T00:04:57-05:00",
                "status": "online",
            },
        },
    },
}

def now_ts():
    tz = timezone(timedelta(hours=-5))
    return datetime.now(tz).strftime("%Y-%m-%dT%H:%M:%S-05:00")


# ─── Routes ───────────────────────────────────────────────────────────────────

# GET /health
# {"facility": "Houston (HOU01)", "status": "healthy", "timestamp": "..."}
@app.route("/health", methods=["GET"])
def health():
    all_healthy = all(lane["healthy"] for lane in LANES.values())
    return jsonify({
        "facility": FACILITY,
        "status": "healthy" if all_healthy else "degraded",
        "timestamp": now_ts(),
    })


# GET /status
# {"facility": "...", "lanes": {...all lanes...}, "totalLanes": 9, "lastSummary": "...", "timestamp": "..."}
@app.route("/status", methods=["GET"])
def status():
    return jsonify({
        "facility": FACILITY,
        "lanes": LANES,
        "totalLanes": len(LANES),
        "lastSummary": "2026-04-14T04:00:39-05:00",
        "timestamp": now_ts(),
    })


# GET /<laneId>/status   e.g. /1/status, /2/status
# {"facility": "...", "lane": "Lane 1", "laneId": 1, "healthy": true, "resources": {...}, "timestamp": "..."}
@app.route("/<int:lane_id>/status", methods=["GET"])
def lane_status(lane_id):
    # find lane by laneId number
    lane_key = next(
        (k for k, v in LANES.items() if v["laneId"] == lane_id), None
    )
    if lane_key is None:
        return jsonify({"error": f"Lane {lane_id} not found"}), 404

    lane = LANES[lane_key]
    return jsonify({
        "facility": FACILITY,
        "lane": lane_key,
        "laneId": lane_id,
        "healthy": lane["healthy"],
        "resources": lane["resources"],
        "timestamp": now_ts(),
    })


if __name__ == "__main__":
    print(f"NOC API running on http://172.16.10.1:5000")
    print(f"  GET /health")
    print(f"  GET /status          → all {len(LANES)} lanes")
    print(f"  GET /{{laneId}}/status → single lane")
    app.run(host="0.0.0.0", port=5000, debug=True)
