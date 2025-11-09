#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Flower Classifier Service
This service loads a trained model and classifies images as "Flower" or "Not a Flower"
Can be called from Node.js via command line with image path or base64 encoded image
"""

# Suppress TensorFlow warnings before importing
import os
import warnings
import logging
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  # Suppress TensorFlow info and warnings
warnings.filterwarnings('ignore')

import sys
import json
import base64
import argparse
from io import BytesIO
from PIL import Image
import numpy as np
import tensorflow as tf
logging.getLogger('tensorflow').setLevel(logging.ERROR)
from tensorflow.keras.models import load_model, Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Dropout

# Model configuration
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'flower_classifier_model.h5')
IMG_HEIGHT = 100
IMG_WIDTH = 100

class FlowerClassifier:
    def __init__(self, model_path=None):
        """Initialize the flower classifier with a trained model"""
        self.model_path = model_path or MODEL_PATH
        self.model = None
        self.img_height = IMG_HEIGHT
        self.img_width = IMG_WIDTH
        
    def load_model(self):
        """Load the trained model from disk"""
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(
                f"Model not found at {self.model_path}. "
                "Please train and save the model first using the training script."
            )
        
        try:
            self.model = load_model(self.model_path)
            return True
        except Exception as e:
            raise Exception(f"Error loading model: {str(e)}")
    
    def create_model(self):
        """Create a new model with the same architecture (for training)"""
        model = Sequential([
            Conv2D(32, (3, 3), activation='relu', input_shape=(self.img_height, self.img_width, 3)),
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
        
        return model
    
    def preprocess_image(self, image_input, is_base64=False):
        """
        Preprocess an image for prediction
        Args:
            image_input: Can be:
                - File path (string)
                - PIL Image object
                - BytesIO object
                - Base64 encoded string
                - Numpy array
            is_base64: If True, treat string input as base64 (not file path)
        Returns:
            Preprocessed image array ready for model prediction
        """
        # Handle different input types
        if isinstance(image_input, str):
            # Check if it's a base64 string
            if is_base64 or image_input.startswith('data:image') or (len(image_input) > 100 and not os.path.exists(image_input)):
                # Try to decode as base64
                try:
                    # Remove data URL prefix if present
                    if ',' in image_input:
                        image_input = image_input.split(',')[1]
                    image_data = base64.b64decode(image_input)
                    img = Image.open(BytesIO(image_data))
                except Exception as e:
                    # If base64 decode fails and it's not marked as base64, try as file path
                    if is_base64:
                        raise ValueError(f"Failed to decode base64 image: {str(e)}")
                    # Assume it's a file path
                    if os.path.exists(image_input):
                        img = Image.open(image_input)
                    else:
                        raise ValueError(f"Invalid base64 or file path: {str(e)}")
            else:
                # Assume it's a file path
                if not os.path.exists(image_input):
                    raise FileNotFoundError(f"Image file not found: {image_input}")
                img = Image.open(image_input)
        elif isinstance(image_input, bytes):
            img = Image.open(BytesIO(image_input))
        elif isinstance(image_input, BytesIO):
            img = Image.open(image_input)
        elif isinstance(image_input, Image.Image):
            img = image_input
        else:
            raise ValueError(f"Unsupported image input type: {type(image_input)}")
        
        # Convert to RGB if necessary
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Resize to model input size
        img = img.resize((self.img_width, self.img_height))
        
        # Convert to array and normalize
        img_array = np.array(img)
        img_array = img_array.astype('float32') / 255.0
        
        # Add batch dimension
        img_array = np.expand_dims(img_array, axis=0)
        
        return img_array
    
    def predict(self, image_input, is_base64=False):
        """
        Predict if an image contains a flower
        Args:
            image_input: Image input (see preprocess_image for supported types)
            is_base64: If True, treat string input as base64 (not file path)
        Returns:
            Dictionary with prediction results:
            {
                'isFlower': bool,
                'confidence': float (0-1),
                'class': str ('Flower' or 'Not a Flower'),
                'score': float (raw prediction score)
            }
        """
        if self.model is None:
            self.load_model()
        
        # Preprocess image
        preprocessed = self.preprocess_image(image_input, is_base64=is_base64)
        
        # Make prediction
        prediction = self.model.predict(preprocessed, verbose=0)
        score = float(prediction[0][0])
        
        # Interpret results
        # Note: The model outputs 0 for Flower, 1 for Not a Flower (binary classification)
        # So score < 0.5 means Flower, score >= 0.5 means Not a Flower
        is_flower = score < 0.5
        confidence = 1 - score if is_flower else score
        
        result = {
            'isFlower': is_flower,
            'confidence': float(confidence),
            'class': 'Flower' if is_flower else 'Not a Flower',
            'score': float(score)
        }
        
        return result


def main():
    """Command-line interface for the flower classifier"""
    parser = argparse.ArgumentParser(description='Flower Classifier Service')
    parser.add_argument('--image', type=str, help='Path to image file')
    parser.add_argument('--base64', type=str, help='Base64 encoded image')
    parser.add_argument('--model', type=str, help='Path to model file (optional)')
    parser.add_argument('--json', action='store_true', help='Output as JSON')
    
    args = parser.parse_args()
    
    try:
        # Initialize classifier
        classifier = FlowerClassifier(model_path=args.model)
        classifier.load_model()
        
        # Get image input
        is_base64_input = False
        if args.base64:
            image_input = args.base64
            is_base64_input = True
        elif args.image:
            image_input = args.image
            is_base64_input = False
        else:
            # Read from stdin (for base64 input)
            image_input = sys.stdin.read().strip()
            if not image_input:
                raise ValueError("No image input provided")
            # When reading from stdin, assume it's base64 encoded data
            is_base64_input = True
        
        # Make prediction
        result = classifier.predict(image_input, is_base64=is_base64_input)
        
        # Output result (always JSON if --json flag is set)
        if args.json:
            # Ensure we output to stdout only
            print(json.dumps(result), flush=True)
            sys.exit(0 if result['isFlower'] else 0)  # Always exit 0 for JSON mode
        else:
            print(f"Class: {result['class']}")
            print(f"Confidence: {result['confidence']:.2%}")
            print(f"Is Flower: {result['isFlower']}")
            sys.exit(0 if result['isFlower'] else 1)
            
    except Exception as e:
        error_result = {
            'error': str(e),
            'isFlower': False,
            'confidence': 0.0,
            'class': 'Error'
        }
        
        if args.json:
            # Always output JSON to stdout, errors to stderr
            print(json.dumps(error_result), flush=True, file=sys.stdout)
        else:
            print(f"Error: {str(e)}", file=sys.stderr)
        
        sys.exit(1)


if __name__ == '__main__':
    main()

