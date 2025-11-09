#include "esp_camera.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ============================================
// CONFIGURATION - UPDATE THESE VALUES
// ============================================
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* apiUrl = "http://YOUR_BACKEND_IP:3001/api/camera/frame";
const char* droneId = "ESP32-CAM-01";

// ============================================
// PIN DEFINITIONS (ESP32-CAM AI-Thinker)
// ============================================
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
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

// ============================================
// CAPTURE SETTINGS
// ============================================
const unsigned long CAPTURE_INTERVAL = 2000; // 2 seconds between captures
unsigned long lastCapture = 0;

// ============================================
// SETUP
// ============================================
void setup() {
  Serial.begin(115200);
  Serial.setDebugOutput(true);
  Serial.println("\n\n=== ESP32-CAM Flower Detector ===");

  // Initialize camera
  if (!initCamera()) {
    Serial.println("Camera initialization failed!");
    while(1) delay(1000); // Halt if camera fails
  }

  // Connect to WiFi
  connectWiFi();

  // Initialize ultrasonic sensor
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  digitalWrite(TRIG_PIN, LOW);

  Serial.println("ESP32-CAM ready! Starting capture loop...");
}

// ============================================
// MAIN LOOP
// ============================================
void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected, reconnecting...");
    connectWiFi();
    delay(5000);
    return;
  }

  // Capture and send image at intervals
  unsigned long currentMillis = millis();
  if (currentMillis - lastCapture >= CAPTURE_INTERVAL) {
    lastCapture = currentMillis;
    captureAndSend();
  }

  delay(100); // Small delay to prevent watchdog issues
}

// ============================================
// CAMERA INITIALIZATION
// ============================================
bool initCamera() {
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
  
  // Lower resolution for faster processing and less memory
  config.frame_size = FRAMESIZE_VGA; // 640x480
  config.jpeg_quality = 12; // 0-63, lower = higher quality (12 is good balance)
  config.fb_count = 1; // Single frame buffer

  // Initialize camera
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x\n", err);
    return false;
  }

  Serial.println("Camera initialized successfully!");
  return true;
}

// ============================================
// WIFI CONNECTION
// ============================================
void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  
  Serial.print("Connecting to WiFi");
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.print("WiFi connected! IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWiFi connection failed!");
  }
}

// ============================================
// CAPTURE AND SEND IMAGE
// ============================================
void captureAndSend() {
  // Capture photo
  camera_fb_t * fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("Camera capture failed");
    return;
  }

  Serial.printf("Captured: %d bytes, %dx%d\n", fb->len, fb->width, fb->height);

  // Read ultrasonic distance
  float distance = readUltrasonicDistance();
  if (distance > 0) {
    Serial.printf("Distance: %.1f cm\n", distance);
  }

  // Send to backend
  HTTPClient http;
  http.begin(apiUrl);
  http.setTimeout(10000); // 10 second timeout

  // Create multipart form data
  String boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
  
  // Build form data
  String formData = "";
  formData += "--" + boundary + "\r\n";
  formData += "Content-Disposition: form-data; name=\"image\"; filename=\"frame.jpg\"\r\n";
  formData += "Content-Type: image/jpeg\r\n\r\n";

  // Calculate content length
  int contentLength = formData.length() + fb->len;
  formData += "\r\n--" + boundary + "\r\n";
  formData += "Content-Disposition: form-data; name=\"width\"\r\n\r\n";
  formData += String(fb->width) + "\r\n";
  formData += "--" + boundary + "\r\n";
  formData += "Content-Disposition: form-data; name=\"height\"\r\n\r\n";
  formData += String(fb->height) + "\r\n";
  formData += "--" + boundary + "\r\n";
  formData += "Content-Disposition: form-data; name=\"droneId\"\r\n\r\n";
  formData += String(droneId) + "\r\n";
  
  if (distance > 0) {
    formData += "--" + boundary + "\r\n";
    formData += "Content-Disposition: form-data; name=\"distance\"\r\n\r\n";
    formData += String(distance) + "\r\n";
  }
  
  formData += "--" + boundary + "--\r\n";
  
  http.addHeader("Content-Type", "multipart/form-data; boundary=" + boundary);
  http.addHeader("Content-Length", String(contentLength + formData.length() - (formData.indexOf("\r\n\r\n") + 4)));

  // Send request
  int httpResponseCode = http.POST((uint8_t*)formData.c_str(), formData.indexOf("\r\n\r\n") + 4);
  
  if (httpResponseCode > 0) {
    // Send image data
    http.getStream().write(fb->buf, fb->len);
    // Send remaining form data
    String remainingData = formData.substring(formData.indexOf("\r\n\r\n") + 4);
    http.getStream().write((uint8_t*)remainingData.c_str(), remainingData.length());
    
    String response = http.getString();
    Serial.printf("HTTP Response: %d\n", httpResponseCode);
    
    if (httpResponseCode == 200) {
      parseDetectionResponse(response);
    }
  } else {
    Serial.printf("HTTP POST failed: %s\n", http.errorToString(httpResponseCode).c_str());
  }

  http.end();
  esp_camera_fb_return(fb);
}

// ============================================
// PARSE DETECTION RESPONSE
// ============================================
void parseDetectionResponse(String response) {
  StaticJsonDocument<1024> doc;
  DeserializationError error = deserializeJson(doc, response);
  
  if (error) {
    Serial.print("JSON parse error: ");
    Serial.println(error.c_str());
    return;
  }

  if (doc["success"] && doc["classification"]) {
    bool flowerDetected = doc["classification"]["isFlower"];
    float confidence = doc["classification"]["confidence"] | 0.0;
    float distance = doc["distance"] | 0.0;
    bool ultrasonicActive = doc["ultrasonicActive"] | false;

    Serial.println("=== Detection Results ===");
    Serial.printf("Flower: %s\n", flowerDetected ? "YES" : "NO");
    Serial.printf("Confidence: %.1f%%\n", confidence * 100);
    
    if (distance > 0) {
      Serial.printf("Distance: %.1f cm\n", distance);
    }
    
    if (ultrasonicActive) {
      Serial.println("*** Ultrasonic Sensor ACTIVE ***");
      Serial.println("Flower is within 25cm - Ready for pollination!");
    } else if (flowerDetected && distance > 25) {
      Serial.println("Flower detected but too far (>25cm)");
    }
    
    Serial.println("========================");
  }
}

// ============================================
// ULTRASONIC DISTANCE READING
// ============================================
float readUltrasonicDistance() {
  // Trigger pulse
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  // Read echo pulse duration
  long duration = pulseIn(ECHO_PIN, HIGH, 30000); // 30ms timeout
  
  if (duration == 0) {
    return -1; // No echo received
  }

  // Calculate distance in cm
  // Speed of sound = 343 m/s = 0.034 cm/μs
  // Distance = (duration * speed) / 2 (round trip)
  float distance = (duration * 0.034) / 2;
  
  // Filter out invalid readings (too close or too far)
  if (distance < 2 || distance > 400) {
    return -1; // Invalid reading
  }
  
  return distance;
}

