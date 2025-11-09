#!/usr/bin/env python3
"""Create a simple test model for flower classification"""

import os
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Dropout

img_height, img_width = 100, 100

"""Creating the nn strcuture"""

model = Sequential([
    Conv2D(32, (3, 3), activation='relu', input_shape=(img_height, img_width, 3)),
    MaxPooling2D((2, 2)),
    Conv2D(64, (3, 3), activation='relu'),
    MaxPooling2D((2, 2)),
    Conv2D(128, (3, 3), activation='relu'),
    MaxPooling2D((2, 2)),
    Flatten(),
    Dense(512, activation='relu'),
    Dropout(0.5),
    Dense(1, activation='sigmoid')
])

model.compile(
    optimizer='adam',
    loss='binary_crossentropy',
    metrics=['accuracy']
)

# Save the model
model_save_path = os.path.join(os.path.dirname(__file__), 'flower_classifier_model.h5')
model.save(model_save_path)
print(f"Test model saved to: {model_save_path}")
print("Note: This is a test model with random weights for testing the interface.")
print("Train with flower_classifier.py for accurate results.")

