# Servo Testing Guide

## Quick Test Commands

After uploading the code to Arduino, open Serial Monitor (115200 baud) and send these commands:

### Basic Tests

1. **`TEST`** - Basic test sequence
   - Moves servo through key positions (HOME → CONTACT_1 → CONTACT_2 → HOME)
   - Good for verifying servo is working

2. **`TEST:45`** - Set specific angle
   - Moves servo to 45 degrees (replace 45 with any angle 0-180)
   - Example: `TEST:90` moves to 90 degrees

3. **`TEST_RANGE`** - Full range test
   - Sweeps servo from 0° to 180° in 10° increments
   - Verifies full range of motion

4. **`TEST_POLLINATE`** - Test pollination sequence
   - Runs pollination motion WITHOUT distance check
   - Perfect for testing without flowers

5. **`TEST_SWEEP`** - Continuous sweep
   - Smooth back-and-forth motion (3 cycles)
   - Good for visual testing

### Ultrasonic Sensor Tests

1. **`DISTANCE`** - Single distance reading
   - Returns current distance in cm
   - Quick check if sensor is working

2. **`TEST_ULTRASONIC`** - Continuous distance readings
   - Reads distance every 500ms for 10 seconds
   - Shows if object is IN_RANGE or TOO_FAR
   - Press any key in Serial Monitor to stop early
   - Perfect for testing sensor accuracy

### Status Commands

- **`STATUS`** - Get current status
  - Returns distance, servo position, ready state

- **`HOME`** - Return to home position (90°)

### Manual Pollination Test

- **`POLL`** - Full pollination (with distance check)
- **`POLL:2`** - Multiple strokes (2 strokes)

## Testing via Serial Monitor

1. Open Arduino IDE
2. Tools → Serial Monitor
3. Set baud rate to **115200**
4. Type command and press Enter
5. Watch servo move and read responses

## Testing via API

```bash
# Test sequence
curl -X POST http://localhost:3001/api/pollination/test

# Test pollination (no distance check)
curl -X POST http://localhost:3001/api/pollination/test \
  -H "Content-Type: application/json" \
  -d '{"type": "pollinate"}'
```

## Recommended Test Sequence

1. **Test ultrasonic sensor first:**
   - `DISTANCE` - Quick check
   - `TEST_ULTRASONIC` - Continuous readings (move hand in front of sensor)

2. **Test servo:**
   - `TEST` - Basic test sequence
   - `TEST:90` - Check home position
   - `TEST_RANGE` - Verify full range

3. **Test combined system:**
   - `TEST_POLLINATE` - Pollination motion without distance check
   - `POLL` - Full pollination with distance check (requires object <40cm away)
   - `STATUS` - Check both servo and sensor status

## Adjusting Servo Angles

If the motion doesn't look right:

1. Test different angles:
   ```
   TEST:30
   TEST:50
   TEST:130
   TEST:150
   ```

2. Find angles that work for your setup

3. Update in code:
   ```cpp
   const int SERVO_CONTACT = 40;    // Change this
   const int SERVO_CONTACT_2 = 140; // Change this
   ```

4. Re-upload and test again

## Troubleshooting

**Servo doesn't move:**
- Check power supply (servo needs adequate current)
- Verify wiring (signal, power, ground)
- Try `TEST:90` to test basic movement

**Servo jitters:**
- Add decoupling capacitor (470µF) across servo power
- Check power supply voltage (should be 5V stable)

**Wrong angles:**
- Use `TEST:45` to test specific angles
- Adjust `SERVO_CONTACT` and `SERVO_CONTACT_2` constants
- Re-upload code

**Ultrasonic sensor issues:**
- Check wiring (Trig: Pin 7, Echo: Pin 6, Vcc: 5V, GND: GND)
- Ensure sensor is facing forward (not blocked)
- Test with `DISTANCE` command
- Verify sensor is HC-SR04 compatible
- Check power supply (sensor needs 5V)
- If readings are erratic, check for interference or loose connections

