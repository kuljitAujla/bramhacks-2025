# Camera Integration with Arduino/ESP32

This guide explains how to connect a camera module to your Arduino/ESP32 for flower detection and send images to the backend API.

## Recommended Hardware Options

### Option 1: ESP32-CAM (Recommended)
**Best for:** Standalone camera system with WiFi
- **Pros:** Built-in camera, WiFi, can send images directly to backend
- **Cons:** More complex setup, requires external antenna
- **Price:** ~$10-15

### Option 2: ArduCam + Arduino Uno
**Best for:** Simple integration with existing Arduino setup
- **Pros:** Works with Arduino Uno, simpler wiring
- **Cons:** Requires additional module, limited processing power
- **Price:** ~$15-20 (ArduCam + Arduino Uno)

### Option 3: ESP32-CAM + Ultrasonic Sensor (All-in-One)
**Best for:** Complete system with camera, distance sensor, and servo control
- **Pros:** Single board handles everything, WiFi enabled
- **Cons:** More expensive, requires more power
- **Price:** ~$15-20

## Option 1: ESP32-CAM Setup (Recommended)

### Hardware Components
- ESP32-CAM module
- FTDI programmer (for initial setup)
- 5V power supply (2A minimum)
- Ultrasonic sensor (HC-SR04) - optional, can use camera-based distance
- Servo motor (for pollination)

### Wiring Diagram

```
ESP32-CAM:
├── 5V → External 5V power supply (+)
├── GND → External power supply (-) + Common GND
├── U0R → FTDI TX (for programming only)
├── U0T → FTDI RX (for programming only)
├── GND → FTDI GND (for programming only)
├── IO0 → GND (hold during programming, then disconnect)
│
├── GPIO 2 → Ultrasonic Trig (optional)
├── GPIO 4 → Ultrasonic Echo (optional)
├── GPIO 12 → Servo Signal (optional)
│
└── Built-in Camera (no external wiring needed)

FTDI Programmer (for initial setup):
├── TX → ESP32-CAM U0R
├── RX → ESP32-CAM U0T
├── GND → ESP32-CAM GND
└── 5V → ESP32-CAM 5V (only during programming)
```

### Software Setup

1. **Install Arduino IDE with ESP32 support**
   - Open Arduino IDE
   - Go to File → Preferences
   - Add to "Additional Board Manager URLs":
     ```
     https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
     ```
   - Go to Tools → Board → Boards Manager
   - Search for "ESP32" and install "esp32 by Espressif Systems"

2. **Install Required Libraries**
   - Tools → Manage Libraries
   - Install:
     - `ESP32 Camera` (by Espressif)
     - `WiFi` (built-in)
     - `HTTPClient` (built-in)
     - `ArduinoJson` (by Benoit Blanchon)

3. **Upload the Sketch**

Create a new sketch file: `esp32_cam_flower_detector.ino`

```cpp
#include "esp_camera.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Backend API URL
const char* apiUrl = "http://YOUR_BACKEND_IP:3001/api/camera/frame";

// Camera pin definitions (ESP32-CAM AI-Thinker)
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y6_GPIO_NUM       37
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

// Ultrasonic sensor pins (optional)
#define TRIG_PIN 2
#define ECHO_PIN 4

// Servo pin (optional)
#define SERVO_PIN 12

// Capture interval (milliseconds)
const unsigned long CAPTURE_INTERVAL = 2000; // 2 seconds
unsigned long lastCapture = 0;

void setup() {
  Serial.begin(115200);
  Serial.setDebugOutput(true);
  Serial.println();

  // Initialize camera
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  
  // Lower resolution for faster processing
  config.frame_size = FRAMESIZE_VGA; // 640x480
  config.jpeg_quality = 12; // 0-63, lower = higher quality
  config.fb_count = 1;

  // Initialize camera
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x", err);
    return;
  }

  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("WiFi connected! IP address: ");
  Serial.println(WiFi.localIP());

  // Initialize ultrasonic sensor (optional)
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  Serial.println("ESP32-CAM ready!");
}

void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected, reconnecting...");
    WiFi.begin(ssid, password);
    delay(5000);
    return;
  }

  // Capture image every CAPTURE_INTERVAL
  unsigned long currentMillis = millis();
  if (currentMillis - lastCapture >= CAPTURE_INTERVAL) {
    lastCapture = currentMillis;
    captureAndSend();
  }
}

void captureAndSend() {
  // Capture photo
  camera_fb_t * fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("Camera capture failed");
    return;
  }

  Serial.printf("Captured image: %d bytes, %dx%d\n", fb->len, fb->width, fb->height);

  // Read ultrasonic distance (optional)
  float distance = readUltrasonicDistance();

  // Send to backend
  HTTPClient http;
  http.begin(apiUrl);
  http.addHeader("Content-Type", "multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW");

  // Create multipart form data
  String boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
  String body = "--" + boundary + "\r\n";
  body += "Content-Disposition: form-data; name=\"image\"; filename=\"frame.jpg\"\r\n";
  body += "Content-Type: image/jpeg\r\n\r\n";
  
  // Convert image to base64 or send binary
  // For simplicity, we'll send as binary in multipart
  String dataStart = body;
  String dataEnd = "\r\n--" + boundary + "--\r\n";
  
  // Add form fields
  String formData = "--" + boundary + "\r\n";
  formData += "Content-Disposition: form-data; name=\"width\"\r\n\r\n";
  formData += String(fb->width) + "\r\n";
  formData += "--" + boundary + "\r\n";
  formData += "Content-Disposition: form-data; name=\"height\"\r\n\r\n";
  formData += String(fb->height) + "\r\n";
  formData += "--" + boundary + "\r\n";
  formData += "Content-Disposition: form-data; name=\"droneId\"\r\n\r\n";
  formData += "ESP32-CAM-01\r\n";
  if (distance > 0) {
    formData += "--" + boundary + "\r\n";
    formData += "Content-Disposition: form-data; name=\"distance\"\r\n\r\n";
    formData += String(distance) + "\r\n";
  }
  formData += "--" + boundary + "\r\n";
  formData += "Content-Disposition: form-data; name=\"image\"; filename=\"frame.jpg\"\r\n";
  formData += "Content-Type: image/jpeg\r\n\r\n";

  // Calculate total length
  int totalLength = formData.length() + fb->len + dataEnd.length();
  
  http.addHeader("Content-Length", String(totalLength));
  
  // Send request
  int httpResponseCode = http.POST((uint8_t*)formData.c_str(), formData.length());
  
  if (httpResponseCode > 0) {
    // Send image data
    http.getStream().write(fb->buf, fb->len);
    // Send end boundary
    http.getStream().write((uint8_t*)dataEnd.c_str(), dataEnd.length());
    
    String response = http.getString();
    Serial.printf("HTTP Response code: %d\n", httpResponseCode);
    Serial.println("Response: " + response);
    
    // Parse response for detection results
    if (httpResponseCode == 200) {
      parseDetectionResponse(response);
    }
  } else {
    Serial.printf("HTTP POST failed, error: %s\n", http.errorToString(httpResponseCode).c_str());
  }

  http.end();
  esp_camera_fb_return(fb);
}

void parseDetectionResponse(String response) {
  // Parse JSON response
  StaticJsonDocument<1024> doc;
  DeserializationError error = deserializeJson(doc, response);
  
  if (error) {
    Serial.print("JSON parse error: ");
    Serial.println(error.c_str());
    return;
  }

  if (doc["success"] && doc["classification"]) {
    bool flowerDetected = doc["classification"]["isFlower"];
    float confidence = doc["classification"]["confidence"];
    float distance = doc["distance"] | 0.0;
    bool ultrasonicActive = doc["ultrasonicActive"] | false;

    Serial.printf("Flower detected: %s, Confidence: %.1f%%, Distance: %.1fcm\n",
                  flowerDetected ? "YES" : "NO",
                  confidence * 100,
                  distance);

    if (flowerDetected && ultrasonicActive) {
      Serial.println("Ultrasonic sensor ACTIVE - Flower within 25cm!");
      // Trigger pollination if needed
      // triggerPollination();
    }
  }
}

float readUltrasonicDistance() {
  // Trigger ultrasonic sensor
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  // Read echo
  long duration = pulseIn(ECHO_PIN, HIGH);
  float distance = (duration * 0.034) / 2; // Convert to cm

  return distance;
}

void triggerPollination() {
  // Add servo control code here
  // This would move the servo to pollinate the flower
  Serial.println("Triggering pollination...");
}
```

### Configuration Steps

1. **Update WiFi credentials** in the sketch:
   ```cpp
   const char* ssid = "YOUR_WIFI_SSID";
   const char* password = "YOUR_WIFI_PASSWORD";
   ```

2. **Update Backend API URL**:
   ```cpp
   const char* apiUrl = "http://YOUR_BACKEND_IP:3001/api/camera/frame";
   ```
   - Replace `YOUR_BACKEND_IP` with your computer's IP address
   - Find your IP: 
     - Windows: `ipconfig` in CMD
     - Mac/Linux: `ifconfig` or `ip addr`

3. **Upload the sketch**:
   - Select board: Tools → Board → ESP32 Arduino → AI Thinker ESP32-CAM
   - Select port: Tools → Port → (your ESP32 port)
   - Hold IO0 button, press RESET, release IO0
   - Click Upload
   - Wait for upload to complete

4. **Test the connection**:
   - Open Serial Monitor (115200 baud)
   - You should see "ESP32-CAM ready!" message
   - Check backend logs for incoming image frames

## Option 2: ArduCam + Arduino Uno

### Hardware Components
- Arduino Uno
- ArduCam Mini 2MP Plus (OV2640)
- Ultrasonic sensor (HC-SR04)
- Servo motor
- SD card module (optional, for local storage)

### Wiring Diagram

```
Arduino Uno:
├── 5V → ArduCam VCC
├── GND → ArduCam GND
├── Pin 13 → ArduCam SCK
├── Pin 12 → ArduCam MISO
├── Pin 11 → ArduCam MOSI
├── Pin 10 → ArduCam CS
├── Pin 7 → Ultrasonic Trig
├── Pin 6 → Ultrasonic Echo
├── Pin 9 → Servo Signal
└── USB → Computer (for serial communication)
```

### Software Setup

1. **Install ArduCam Library**
   - Tools → Manage Libraries
   - Search for "ArduCam" and install

2. **Upload Sketch** (see `arducam_flower_detector.ino` in hardware folder)

**Note:** Arduino Uno has limited memory and processing power. For camera integration, ESP32-CAM is strongly recommended.

## Integration with Backend

The ESP32-CAM sends images to:
```
POST http://YOUR_BACKEND_IP:3001/api/camera/frame
```

The backend will:
1. Receive the image
2. Classify it using the flower detection model
3. Calculate distance (if ultrasonic data provided)
4. Activate ultrasonic sensor if flower is within 25cm
5. Return detection results

## Troubleshooting

### Camera not initializing
- Check wiring connections
- Ensure 5V power supply provides at least 2A
- Try different camera resolution (lower = more stable)

### WiFi connection issues
- Verify SSID and password are correct
- Check WiFi signal strength
- Ensure backend server is running and accessible

### Images not sending
- Check backend API URL is correct
- Verify backend server is running: `npm start` in backend folder
- Check Serial Monitor for error messages

### Ultrasonic sensor not working
- Verify wiring (Trig, Echo, Vcc, GND)
- Check sensor is properly mounted
- Test sensor separately before integration

## Next Steps

1. Test camera capture and WiFi connection
2. Verify images are being received by backend
3. Test flower detection with real flowers
4. Calibrate distance measurements
5. Integrate with pollination servo control

## Power Requirements

- **ESP32-CAM**: 5V, 2A minimum (camera draws significant current)
- **Arduino Uno + ArduCam**: 5V, 1A minimum
- Use external power supply, not USB power (too weak for camera)

## Safety Notes

- Handle ESP32-CAM carefully (static sensitive)
- Use proper power supply (undervoltage can damage board)
- Keep camera lens clean for best detection results
- Test in controlled environment before field deployment

