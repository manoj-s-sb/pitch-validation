# Coordinate Conversion - CV System to Lane App

## Two Coordinate Systems

This application deals with two different coordinate systems:

1. **CV (Computer Vision) System** - The actual measured pitching point from the camera/vision system, reported in **centimeters**.
2. **Lane App System** - The internal coordinate system used by the bowling machine app to represent positions on a pitch canvas, reported in **pixel/canvas units**.

---

## CV Coordinate System (Actual Pitching Point)

The CV system provides where the ball actually landed, measured in centimeters.

**CSV Columns:** `Pitching point x` and `Pitching point z`

### X-Axis (Width)

- **Origin (X = 0):** Center of the pitch (middle stump line)
- **Positive X:** Ball landed towards the **leg side** (right of center when facing the bowler)
- **Negative X:** Ball landed towards the **off side** (left of center when facing the bowler)
- **Range:** Approximately **-150 cm** to **+150 cm** (pitch is 3 meters / 300 cm wide)

### Y-Axis (Length)

- The CV uses the **Z-axis** for length (depth down the pitch)
- **Origin (Z = 0):** Top center of the center stump (batsman's end)
- **Positive Z:** Further away from the batsman (towards the bowler)
- **Range:** **0 cm** to **1000 cm** (pitch is 10 meters long)

```
              CV Coordinate System (Top-down view)

                    Stumps (Z = 0)
                        |
          -150 cm ------0------ +150 cm
              |         |         |
              |   Off   | Center  |   Leg
              |   Side  |         |   Side
              |         |         |
              |         |         |
              |         |         |
              |         |         |
              |         |         |
          -150 cm ------0------ +150 cm
                        |
                   (Z = 1000 cm)
                   Bowler's end
```

---

## Lane App Coordinate System (Config / Set Values)

The Lane App uses a canvas-based system to represent target positions.

**CSV Columns:** `x` and `y`

### X-Axis (Width)

- **Range:** **0** to **300** (canvas units, where 1 unit = 1 cm)
- **Center of pitch:** **X = 150**
- **0** = Far off side edge
- **300** = Far leg side edge

### Y-Axis (Length)

- **Range:** **0** to **100** (canvas percentage units)
- **0** = Batsman's end (stumps)
- **100** = Bowler's end
- Each unit maps to **10 cm** of real pitch (100 units = 1000 cm)

```
              Lane App Coordinate System

                    Stumps (Y = 0)
                        |
             0 --------150-------- 300
              |         |         |
              |   Off   | Center  |   Leg
              |   Side  |         |   Side
              |         |         |
              |         |         |
              |         |         |
              |         |         |
              |         |         |
             0 --------150-------- 300
                        |
                    (Y = 100)
                   Bowler's end
```

---

## Conversion Logic

### CV (cm) to Lane App (canvas units)

When the CV reports where the ball actually landed, we convert it to Lane App coordinates so it can be plotted on the same canvas as the configured target.

#### X-Axis: `actualX = pitchXcm + 150`

| What happens                                   | Why                                         |
| ---------------------------------------------- | ------------------------------------------- |
| CV center is **0**, Lane App center is **150** | We shift the origin by adding 150           |
| CV positive (+) = leg side                     | Lane App value becomes **> 150** (leg side) |
| CV negative (-) = off side                     | Lane App value becomes **< 150** (off side) |

**Examples:**

| CV X (cm) | Calculation     | Lane App X | Position     |
| --------- | --------------- | ---------- | ------------ |
| 0         | 0 + 150 = 150   | 150        | Dead center  |
| +50       | 50 + 150 = 200  | 200        | Leg side     |
| -50       | -50 + 150 = 100 | 100        | Off side     |
| +150      | 150 + 150 = 300 | 300        | Far leg edge |
| -150      | -150 + 150 = 0  | 0          | Far off edge |

#### Y-Axis: `actualY = pitchZcm / 1000 * 80`

| What happens                                                  | Why                                                                          |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| CV range is **0-1000 cm**, canvas pitchable area is **0-80%** | We scale 1000 cm down to 80 canvas units                                     |
| The pitchable zone on the canvas covers **0% to 80%**         | The remaining 20% (80-100%) is the "Shorts" zone beyond normal bowling range |

**Examples:**

| CV Z (cm) | Calculation            | Lane App Y | Length Zone    |
| --------- | ---------------------- | ---------- | -------------- |
| 0         | 0 / 1000 \* 80 = 0     | 0          | Full Toss      |
| 100       | 100 / 1000 \* 80 = 8   | 8          | Yorkers        |
| 250       | 250 / 1000 \* 80 = 20  | 20         | Half Volley    |
| 500       | 500 / 1000 \* 80 = 40  | 40         | Full           |
| 750       | 750 / 1000 \* 80 = 60  | 60         | Length         |
| 1000      | 1000 / 1000 \* 80 = 80 | 80         | Back of Length |

---

### Lane App (canvas units) to CV (cm)

Used in reports to convert configured target positions back to real-world centimeters for comparison.

#### X-Axis: `configXcm = x - 150`

The reverse of the above. Subtracting 150 shifts the Lane App origin back to center.

#### Y-Axis: `configYcm = y / 100 * 1000`

Scales the 0-100 canvas range back to the 0-1000 cm real-world range.

---

### Canvas to Screen (Plotting)

To render dots on the visual pitch canvas in the browser:

| Axis | Formula               | Result                                         |
| ---- | --------------------- | ---------------------------------------------- |
| X    | `left% = canvasX / 3` | 0-300 maps to 0-100% of canvas width           |
| Y    | `top% = canvasY`      | 0-100 maps directly to 0-100% of canvas height |

---

## Conversion Summary

| Direction            | X Formula       | Y Formula              |
| -------------------- | --------------- | ---------------------- |
| CV (cm) to Lane App  | `cm + 150`      | `cm / 1000 * 80`       |
| Lane App to CV (cm)  | `laneApp - 150` | `laneApp / 100 * 1000` |
| Lane App to Screen % | `laneApp / 3`   | `laneApp` (direct %)   |

---

## Key Relationships

```
CV X = 0          <==>  Lane App X = 150       (Center of pitch)
CV X = positive   <==>  Lane App X > 150       (Leg side)
CV X = negative   <==>  Lane App X < 150       (Off side)

CV Z = 0          <==>  Lane App Y = 0         (Stumps / Batsman's end)
CV Z = 1000       <==>  Lane App Y = 80        (End of pitchable zone)
```

---

## Code Reference

File: `src/utils/pitch.js`

```js
// CV (cm) to Lane App (canvas units)
const actualX = pitchXcm + 150; // line 70
const actualY = (pitchZcm / 1000) * 80; // line 71

// Lane App (canvas units) to CV (cm)
function configXtoCm(x) {
  return x - 150;
} // line 79
function configYtoCm(y) {
  return (y / 100) * 1000;
} // line 82
```

---

## Length Zones on the Pitch Canvas

| Zone           | Canvas Y Range | Real-World Distance | Color  |
| -------------- | -------------- | ------------------- | ------ |
| Full Toss      | 0 - 8          | 0 - 1 m             | Red    |
| Yorkers        | 8 - 16         | 1 - 2 m             | Yellow |
| Half Volley    | 16 - 32        | 2 - 4 m             | Green  |
| Full           | 32 - 48        | 4 - 6 m             | Red    |
| Length         | 48 - 64        | 6 - 8 m             | Purple |
| Back of Length | 64 - 80        | 8 - 10 m            | Blue   |
| Shorts         | 80 - 100       | Beyond 10 m         | Dark   |

## Line Zones on the Pitch Canvas

| Zone        | Canvas X Range | Screen %        |
| ----------- | -------------- | --------------- |
| Outside Off | 0 - 100        | 0% - 33.33%     |
| Inline      | 100 - 200      | 33.33% - 66.66% |
| Outside Leg | 200 - 300      | 66.66% - 100%   |
