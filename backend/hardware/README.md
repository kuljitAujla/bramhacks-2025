# Flower Pollination Hardware System

Hardware setup for drone-based flower pollination using Arduino Uno R3, servo motor, and ultrasonic sensor.

## Hardware Components

- **Arduino Uno R3**
- **Servo Motor** (hobby servo, 180° range)
- **Ultrasonic Sensor** (HC-SR04)
- **5V Battery** (capable of supplying servo current)

## Wiring Diagram

```
Arduino Uno R3:
├── Pin 9 (PWM) → Servo Signal (yellow/orange wire)
├── Pin 7 → Ultrasonic Trig
├── Pin 6 → Ultrasonic Echo
├── 5V → Ultrasonic Vcc
├── GND → Servo GND + Ultrasonic GND (common ground)
└── USB → Computer/Raspberry Pi (for serial communication)

Servo:
├── Red wire → 5V Battery (+)
├── Black/Brown wire → GND (common with Arduino)
└── Yellow/Orange wire → Arduino Pin 9

Ultrasonic (HC-SR04):
├── Vcc → 5V (Arduino or battery)
├── GND → GND (common)
├── Trig → Arduino Pin 7
└── Echo → Arduino Pin 6

5V Battery:
├── (+) → Servo Red wire
└── (-) → Common GND (Arduino + Servo + Ultrasonic)
```

## Arduino Setup

1. **Install Arduino IDE** (if not already installed)
   - Download from: https://www.arduino.cc/en/software

2. **Upload the sketch**
   - Open `pollination_controller.ino` in Arduino IDE
   - Select board: Tools → Board → Arduino Uno
   - Select port: Tools → Port → (your Arduino port)
   - Click Upload

3. **Verify connection**
   - Open Serial Monitor (Tools → Serial Monitor)
   - Set baud rate to 115200
   - You should see "ARDUINO_READY" message

## Backend API Setup

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Start the server**
   ```bash
   npm start
   # or for development with auto-reload:
   npm run dev
   ```

3. **Connect Arduino**
   - Connect Arduino via USB to your computer
   - The server will auto-detect the Arduino
   - Or manually specify port: `POST /api/pollination/connect` with `{ "port": "/dev/ttyUSB0" }` (Linux) or `{ "port": "COM3" }` (Windows)

## API Endpoints

### Connection Management

- **POST** `/api/pollination/connect`
  - Connect to Arduino
  - Body: `{ "port": "/dev/ttyUSB0" }` (optional)
  
- **POST** `/api/pollination/disconnect`
  - Disconnect from Arduino

- **GET** `/api/pollination/status`
  - Get connection status and distance reading

### Pollination Actions

- **POST** `/api/pollination/pollinate`
  - Trigger pollination
  - Body: `{ "strokes": 1 }` (optional, default: 1)
  
- **POST** `/api/pollination/detect`
  - Handle CNN detection result
  - Body:
    ```json
    {
      "flowerDetected": true,
      "position": { "x": 0, "y": 0, "z": 30 },
      "distance": 25,
      "confidence": 0.85
    }
    ```

- **POST** `/api/pollination/home`
  - Move servo to home position

- **POST** `/api/pollination/test`
  - Run test sequence

## CNN Integration Example

```javascript
// Example: Send detection result from CNN to API
async function handleFlowerDetection(flowerData) {
  const response = await fetch('http://localhost:3001/api/pollination/detect', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      flowerDetected: flowerData.detected,
      position: flowerData.position,
      distance: flowerData.distance,
      confidence: flowerData.confidence
    })
  });
  
  const result = await response.json();
  console.log('Pollination result:', result);
}
```

## Configuration

### Arduino Configuration (in `.ino` file)

- `MAX_TRIGGER_DISTANCE_CM`: Maximum distance to pollinate (default: 40cm)
- `SERVO_HOME`: Neutral position (default: 90°)
- `SERVO_CONTACT`: First contact angle (default: 40°)
- `SERVO_CONTACT_2`: Second contact angle (default: 140°)
- `SERVO_STROKE_DELAY`: Delay between movements (default: 350ms)

### Adjusting Servo Angles

1. Test with `POST /api/pollination/test` endpoint
2. Adjust `SERVO_CONTACT` and `SERVO_CONTACT_2` in Arduino code
3. Re-upload sketch
4. Test again until motion is smooth and gentle

## Troubleshooting

### Arduino not detected
- Check USB connection
- Verify Arduino drivers are installed
- Try different USB port
- On Linux: add user to `dialout` group: `sudo usermod -a -G dialout $USER`

### Servo not moving
- Check power supply (servo needs adequate current)
- Verify wiring (signal, power, ground)
- Test with Arduino IDE Serial Monitor: send `TEST` command

### Distance readings incorrect
- Ensure ultrasonic sensor is properly mounted
- Check for obstructions in front of sensor
- Verify wiring (Trig, Echo, Vcc, GND)

### Serial communication errors
- Check baud rate matches (115200)
- Ensure only one program is accessing serial port
- Try disconnecting and reconnecting Arduino

## Safety Notes

- Test on mock flowers first
- Ensure servo motion is gentle and won't damage flowers
- Monitor battery voltage (servo can drain battery quickly)
- Keep pollination mechanism lightweight for drone payload
- Follow local drone regulations

## Next Steps

1. Mount hardware on drone frame
2. Calibrate servo angles for your specific flower type
3. Integrate with CNN detection system
4. Test in controlled environment
5. Fine-tune timing and motion for optimal pollination

