/*
 * Flower Pollination Controller
 * Arduino Uno R3 - Controls servo and ultrasonic sensor
 * Communicates via Serial (USB) with backend API
 * 
 * NOTE: This file must be opened/compiled in Arduino IDE
 * The Servo.h library comes pre-installed with Arduino IDE
 * If you see IntelliSense errors, ignore them - the code will compile in Arduino IDE
 */

#include <Servo.h>  // Standard Arduino library - included with Arduino IDE
#include <string.h> // For strcmp, strncmp, atoi

Servo pollServo;

// Pin definitions - Updated for your wiring
const int trigPin = A4;      // Ultrasonic Trig → Analog Pin A4
const int echoPin = A5;      // Ultrasonic Echo → Analog Pin A5
const int servoPin = 11;     // Servo Signal → Digital Pin 11
// Servo Power → 5V (shared with ultrasonic VCC)
// Servo Ground → GND (shared with ultrasonic GND)
// Ultrasonic VCC → 5V (shared with servo power)
// Ultrasonic GND → GND (shared with servo ground)

// Configuration
const long MAX_TRIGGER_DISTANCE_CM = 40;  // Only pollinate if within this distance
const int SERVO_HOME = 90;                // Neutral position
const int SERVO_CONTACT = 40;             // Angle to touch flower (adjust based on your setup)
const int SERVO_CONTACT_2 = 140;          // Secondary angle for brushing motion
const int SERVO_STROKE_DELAY = 350;       // Delay between servo movements (ms)
const int SERVO_RETURN_DELAY = 300;       // Delay before returning home (ms)

// Status tracking
bool isPollinating = false;
unsigned long lastPollinationTime = 0;

void setup() {
  // Reduce Serial buffer to save RAM (default is 64 bytes)
  Serial.begin(115200);
  
  // Initialize servo
  pollServo.attach(servoPin);
  pollServo.write(SERVO_HOME);
  delay(500);
  
  // Initialize ultrasonic sensor
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  
  delay(500);
  Serial.println(F("ARDUINO_READY"));
  Serial.println(F("Wiring: Servo Pin 11, Trig A4, Echo A5"));
  Serial.println(F("Type 'TEST_SERVO' or 'TEST_SENSOR' to test"));
}

/**
 * Read distance from ultrasonic sensor (HC-SR04)
 * Returns distance in cm, or -1 if no reading
 * Outputs calculation details for testing
 */
int readDistanceCm() {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  
  unsigned long duration = pulseIn(echoPin, HIGH, 30000); // 30ms timeout
  
  // Output calculation details for testing
  Serial.print(F("DEBUG: duration="));
  Serial.print(duration);
  Serial.print(F(" microseconds"));
  
  if (duration == 0) {
    Serial.println(F(" -> NO_READING"));
    return -1; // No reading
  }
  
  // Calculate distance: (duration * speed of sound) / 2
  // Speed of sound = 340 m/s = 0.034 cm/microsecond
  // Formula: distance = (duration * 0.034) / 2
  float distanceFloat = (duration * 0.034) / 2.0;
  int distance = (int)distanceFloat;
  
  // Output calculation steps
  Serial.print(F(" | calculation: ("));
  Serial.print(duration);
  Serial.print(F(" * 0.034) / 2 = "));
  Serial.print(distanceFloat, 2);
  Serial.print(F(" cm -> "));
  Serial.print(distance);
  Serial.println(F(" cm"));
  
  return distance;
}

/**
 * Perform pollination stroke sequence
 * Moves servo in brushing motion to transfer pollen
 */
void doPollinate() {
  if (isPollinating) {
    Serial.println(F("BUSY"));
    return;
  }
  
  isPollinating = true;
  
  // Check distance first
  int distance = readDistanceCm();
  
  if (distance < 0) {
    Serial.println(F("DISTANCE_ERR"));
    isPollinating = false;
    return;
  }
  
  Serial.print(F("DIST:"));
  Serial.println(distance);
  
  // Safety check - don't pollinate if too far
  if (distance > MAX_TRIGGER_DISTANCE_CM) {
    Serial.println(F("TOO_FAR"));
    isPollinating = false;
    return;
  }
  
  // Perform brushing motion
  pollServo.write(SERVO_CONTACT);
  delay(SERVO_STROKE_DELAY);
  pollServo.write(SERVO_CONTACT_2);
  delay(SERVO_STROKE_DELAY);
  pollServo.write(SERVO_CONTACT);
  delay(200);
  pollServo.write(SERVO_HOME);
  delay(SERVO_RETURN_DELAY);
  
  lastPollinationTime = millis();
  isPollinating = false;
  Serial.println(F("POLL_DONE"));
}

/**
 * Test sequence - moves servo through key positions
 */
void doTestSequence() {
  Serial.println(F("TEST_START"));
  pollServo.write(SERVO_HOME);
  delay(500);
  Serial.println(F("POS:HOME"));
  pollServo.write(SERVO_CONTACT);
  delay(500);
  Serial.println(F("POS:CONTACT_1"));
  pollServo.write(SERVO_CONTACT_2);
  delay(500);
  Serial.println(F("POS:CONTACT_2"));
  pollServo.write(SERVO_HOME);
  delay(500);
  Serial.println(F("TEST_DONE"));
}

/**
 * Test full range of motion (0-180 degrees)
 */
void doTestRange() {
  Serial.println(F("TEST_RANGE_START"));
  for (int angle = 0; angle <= 180; angle += 10) {
    pollServo.write(angle);
    delay(200);
    Serial.print(F("ANGLE:"));
    Serial.println(angle);
  }
  pollServo.write(SERVO_HOME);
  delay(500);
  Serial.println(F("TEST_RANGE_DONE"));
}

/**
 * Test pollination sequence without distance check
 */
void doTestPollinate() {
  Serial.println(F("TEST_POLLINATE_START"));
  pollServo.write(SERVO_CONTACT);
  delay(SERVO_STROKE_DELAY);
  Serial.println(F("POS:CONTACT_1"));
  pollServo.write(SERVO_CONTACT_2);
  delay(SERVO_STROKE_DELAY);
  Serial.println(F("POS:CONTACT_2"));
  pollServo.write(SERVO_CONTACT);
  delay(200);
  pollServo.write(SERVO_HOME);
  delay(SERVO_RETURN_DELAY);
  Serial.println(F("TEST_POLLINATE_DONE"));
}

/**
 * Continuous sweep test (back and forth)
 */
void doTestSweep() {
  Serial.println(F("TEST_SWEEP_START"));
  for (int i = 0; i < 3; i++) {
    for (int angle = SERVO_HOME; angle >= SERVO_CONTACT; angle -= 5) {
      pollServo.write(angle);
      delay(50);
    }
    for (int angle = SERVO_CONTACT; angle <= SERVO_CONTACT_2; angle += 5) {
      pollServo.write(angle);
      delay(50);
    }
    for (int angle = SERVO_CONTACT_2; angle >= SERVO_HOME; angle -= 5) {
      pollServo.write(angle);
      delay(50);
    }
    Serial.print(F("SWEEP_CYCLE:"));
    Serial.println(i + 1);
  }
  Serial.println(F("TEST_SWEEP_DONE"));
}

/**
 * Test ultrasonic sensor - continuous readings
 */
void doTestUltrasonic() {
  Serial.println(F("TEST_ULTRASONIC_START"));
  unsigned long startTime = millis();
  unsigned long testDuration = 10000; // 10 seconds
  while (millis() - startTime < testDuration) {
    int distance = readDistanceCm();
    if (distance < 0) {
      Serial.println(F("DISTANCE:ERROR"));
    } else {
      Serial.print(F("DISTANCE:"));
      Serial.print(distance);
      Serial.println(distance > MAX_TRIGGER_DISTANCE_CM ? F(" TOO_FAR") : F(" OK"));
    }
    delay(500);
    if (Serial.available()) {
      Serial.println(F("TEST_ULTRASONIC_STOPPED"));
      return;
    }
  }
  Serial.println(F("TEST_ULTRASONIC_DONE"));
}

/**
 * Test servo motor only - visual verification
 */
void doTestServoOnly() {
  Serial.println(F("SERVO_TEST_START"));
  pollServo.write(SERVO_HOME);
  delay(1000);
  Serial.println(F("HOME"));
  pollServo.write(SERVO_CONTACT);
  delay(1000);
  Serial.println(F("CONTACT_1"));
  pollServo.write(SERVO_CONTACT_2);
  delay(1000);
  Serial.println(F("CONTACT_2"));
  for (int angle = 0; angle <= 180; angle += 30) {
    pollServo.write(angle);
    delay(300);
    Serial.print(F("ANGLE:"));
    Serial.println(angle);
  }
  pollServo.write(SERVO_HOME);
  delay(1000);
  Serial.println(F("SERVO_TEST_DONE"));
}

/**
 * Test ultrasonic sensor only - detailed readings
 */
void doTestSensorOnly() {
  Serial.println(F("SENSOR_TEST_START"));
  unsigned long startTime = millis();
  unsigned long testDuration = 10000; // 10 seconds
  byte readingCount = 0;
  byte errorCount = 0;
  int minDistance = 999;
  int maxDistance = 0;
  int totalDistance = 0;
  
  while (millis() - startTime < testDuration) {
    int distance = readDistanceCm();
    readingCount++;
    
    if (distance < 0) {
      errorCount++;
      Serial.println(F("ERROR"));
    } else {
      totalDistance += distance;
      if (distance < minDistance) minDistance = distance;
      if (distance > maxDistance) maxDistance = distance;
      Serial.print(F("DIST:"));
      Serial.print(distance);
      Serial.println(distance > MAX_TRIGGER_DISTANCE_CM ? F(" TOO_FAR") : F(" OK"));
    }
    
    delay(500);
    if (Serial.available()) {
      Serial.println(F("STOPPED"));
      break;
    }
  }
  
  Serial.print(F("READINGS:"));
  Serial.println(readingCount);
  Serial.print(F("ERRORS:"));
  Serial.println(errorCount);
  if (readingCount > errorCount) {
    Serial.print(F("MIN:"));
    Serial.println(minDistance);
    Serial.print(F("MAX:"));
    Serial.println(maxDistance);
    Serial.print(F("AVG:"));
    Serial.println(totalDistance / (readingCount - errorCount));
  }
  Serial.println(F("SENSOR_TEST_DONE"));
}

/**
 * Test both servo and sensor together
 */
void doTestAll() {
  Serial.println(F("TEST_ALL_START"));
  doTestServoOnly();
  delay(1000);
  doTestSensorOnly();
  delay(1000);
  int distance = readDistanceCm();
  if (distance > 0 && distance <= MAX_TRIGGER_DISTANCE_CM) {
    Serial.print(F("DIST_OK:"));
    Serial.println(distance);
    doPollinate();
  } else {
    Serial.print(F("DIST:"));
    Serial.println(distance < 0 ? F("ERROR") : F("TOO_FAR"));
  }
  Serial.println(F("TEST_ALL_DONE"));
}

/**
 * Perform multiple pollination strokes
 */
void doPollinateMultiple(int strokes) {
  if (isPollinating) {
    Serial.println(F("BUSY"));
    return;
  }
  isPollinating = true;
  int distance = readDistanceCm();
  if (distance < 0 || distance > MAX_TRIGGER_DISTANCE_CM) {
    Serial.println(distance < 0 ? F("DISTANCE_ERR") : F("TOO_FAR"));
    isPollinating = false;
    return;
  }
  Serial.print(F("DIST:"));
  Serial.println(distance);
  Serial.print(F("STROKES:"));
  Serial.println(strokes);
  for (int i = 0; i < strokes; i++) {
    pollServo.write(SERVO_CONTACT);
    delay(SERVO_STROKE_DELAY);
    pollServo.write(SERVO_CONTACT_2);
    delay(SERVO_STROKE_DELAY);
    pollServo.write(SERVO_CONTACT);
    delay(200);
  }
  pollServo.write(SERVO_HOME);
  delay(SERVO_RETURN_DELAY);
  lastPollinationTime = millis();
  isPollinating = false;
  Serial.println(F("POLL_DONE"));
}

void loop() {
  if (Serial.available()) {
    // Use fixed-size buffer instead of String to save RAM
    char cmdBuffer[32] = {0};
    int index = 0;
    
    // Read command character by character
    while (Serial.available() && index < 31) {
      char c = Serial.read();
      if (c == '\n' || c == '\r') break;
      if (c >= 'a' && c <= 'z') c -= 32; // Convert to uppercase
      cmdBuffer[index++] = c;
      delay(1); // Small delay for serial buffer
    }
    
    // Trim whitespace
    while (index > 0 && (cmdBuffer[index-1] == ' ' || cmdBuffer[index-1] == '\t')) {
      cmdBuffer[--index] = 0;
    }
    
    // Compare commands using strcmp
    if (strcmp(cmdBuffer, "POLL") == 0) {
      doPollinate();
    } 
    else if (strncmp(cmdBuffer, "POLL:", 5) == 0) {
      // Parse number of strokes: POLL:2
      int strokes = atoi(cmdBuffer + 5);
      if (strokes > 0 && strokes <= 5) {
        doPollinateMultiple(strokes);
      } else {
        Serial.println(F("INVALID_STROKES"));
      }
    }
    else if (strcmp(cmdBuffer, "STATUS") == 0) {
      int distance = readDistanceCm();
      if (distance < 0) {
        Serial.println(F("DIST:-1"));
      } else {
        Serial.print(F("DIST:"));
        Serial.println(distance);
      }
      Serial.print(F("HOME:"));
      Serial.println(pollServo.read());
      Serial.print(F("READY:"));
      Serial.println(isPollinating ? F("0") : F("1"));
    }
    else if (strcmp(cmdBuffer, "TEST_ULTRASONIC") == 0) {
      doTestUltrasonic();
    }
    else if (strcmp(cmdBuffer, "DISTANCE") == 0) {
      int distance = readDistanceCm();
      if (distance < 0) {
        Serial.println(F("DISTANCE_ERR"));
      } else {
        Serial.print(F("DISTANCE:"));
        Serial.print(distance);
        Serial.println(F("cm"));
      }
    }
    else if (strcmp(cmdBuffer, "HOME") == 0) {
      pollServo.write(SERVO_HOME);
      Serial.println(F("HOMED"));
    }
    else if (strcmp(cmdBuffer, "TEST") == 0) {
      doTestSequence();
    }
    else if (strncmp(cmdBuffer, "TEST:", 5) == 0) {
      int angle = atoi(cmdBuffer + 5);
      if (angle >= 0 && angle <= 180) {
        pollServo.write(angle);
        Serial.print(F("SET_ANGLE:"));
        Serial.println(angle);
      } else {
        Serial.println(F("INVALID_ANGLE"));
      }
    }
    else if (strcmp(cmdBuffer, "TEST_RANGE") == 0) {
      doTestRange();
    }
    else if (strcmp(cmdBuffer, "TEST_POLLINATE") == 0) {
      doTestPollinate();
    }
    else if (strcmp(cmdBuffer, "TEST_SWEEP") == 0) {
      doTestSweep();
    }
    else if (strcmp(cmdBuffer, "TEST_SERVO") == 0) {
      doTestServoOnly();
    }
    else if (strcmp(cmdBuffer, "TEST_SENSOR") == 0) {
      doTestSensorOnly();
    }
    else if (strcmp(cmdBuffer, "TEST_ALL") == 0) {
      doTestAll();
    }
    else {
      Serial.println(F("UNKNOWN_CMD"));
    }
  }
  
  // Small delay to prevent overwhelming serial buffer
  delay(10);
}

