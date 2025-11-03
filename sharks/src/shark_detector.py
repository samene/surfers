#!/usr/bin/env python3
"""
Shark Detector - Real-time shark detection using trained model.
Uses OpenCV for video processing and TensorFlow/TFLite for inference.

Example usage:
    # Using webcam
    python shark_detector.py --model models/best_shark_model.h5
    
    # Using video file
    python shark_detector.py --model models/best_shark_model.h5 --input videos/beach.mp4
    
    # Using TFLite model
    python shark_detector.py --model models/best_shark_mobilenetv2.tflite --tflite
"""

import argparse
import datetime
import sys
from pathlib import Path

import requests
import cv2
import numpy as np
import base64
import json
import os
from datetime import datetime

# Optional imports based on model type
try:
    import tensorflow as tf
    HAVE_TF = True
except ImportError:
    HAVE_TF = False

try:
    import tflite_runtime.interpreter as tflite
    HAVE_TFLITE = True
except ImportError:
    HAVE_TFLITE = False


class SharkDetector:
    """Shark detection in video streams using TF/TFLite models."""
    
    def __init__(self, model_path, use_tflite=False, threshold=0.5):
        """Initialize the detector with a model file.
        
        Args:
            model_path: Path to .h5 or .tflite model
            use_tflite: If True, load as TFLite model
            threshold: Detection confidence threshold (0-1)
        """
        self.model_path = Path(model_path)
        self.threshold = threshold
        self.img_size = 224  # Standard size used in training
        
        if not self.model_path.exists():
            raise FileNotFoundError(f"Model not found: {model_path}")
        
        # remember mode to avoid referencing optional imports directly elsewhere
        self.use_tflite = bool(use_tflite)
        self.interpreter = None
        self.input_details = None
        self.output_details = None

        if self.use_tflite:
            if not HAVE_TFLITE:
                raise ImportError("TFLite runtime not available. Install tflite-runtime.")
            # load tflite interpreter and keep references
            self.interpreter = self._load_tflite_model()
            self.input_details = self.interpreter.get_input_details()
            self.output_details = self.interpreter.get_output_details()
        else:
            if not HAVE_TF:
                raise ImportError("TensorFlow not available. Install tensorflow.")
            self.model = self._load_tf_model()
    
    def _load_tf_model(self):
        """Load regular TensorFlow model."""
        # return tf.keras.models.load_model(self.model_path)
        return tf.keras.models.load_model(self.model_path, compile=False)
    
    def _load_tflite_model(self):
        """Load and prepare TFLite model."""
        interpreter = tflite.Interpreter(model_path=str(self.model_path))
        interpreter.allocate_tensors()
        return interpreter
    
    def preprocess_frame(self, frame):
        """Preprocess a frame for inference."""
        # Resize and normalize
        img = cv2.resize(frame, (self.img_size, self.img_size))
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        img = img.astype(np.float32) / 255.0
        
        # Add batch dimension
        return np.expand_dims(img, axis=0)
    
    def predict(self, frame):
        """Run inference on a frame."""
        processed = self.preprocess_frame(frame)
        # Branch based on model type (avoid referencing optional modules directly)
        if self.use_tflite:
            # TFLite inference using stored interpreter
            self.interpreter.set_tensor(self.input_details[0]['index'], processed.astype(self.input_details[0]['dtype']))
            self.interpreter.invoke()
            prediction = self.interpreter.get_tensor(self.output_details[0]['index'])
            score = float(prediction.ravel()[0])
        else:
            # Regular TF inference
            prediction = self.model.predict(processed, verbose=0)
            score = float(prediction[0][0])
        
        return score
    
    def process_frame(self, frame):
        """Process a frame and add visual feedback."""
        # Make prediction
        score = self.predict(frame)
        
        # Add visual feedback
        current_time_stamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        text = f"{current_time_stamp}"        
        color = (0, 255, 0) 
        if score > self.threshold:
            color = (0, 0, 255)
            text += f" | Shark Spotted" 
        cv2.putText(frame, text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
        
        if score > self.threshold:
            # Draw red rectangle for high confidence shark detection
            h, w = frame.shape[:2]
            cv2.rectangle(frame, (0, 0), (w, h), color, 2)
            # encode frame as JPEG and base64 for metadata
            ok, buf = cv2.imencode('.jpg', frame)
            if ok:
                b64_frame = base64.b64encode(buf.tobytes()).decode('utf-8')
            else:
                b64_frame = ""

            payload = {
                "droneName": os.getenv("DRONE_NAME", "drone-1"),
                "sharkType": "unknown",
                "size": 0.0,
                "lattitude": float(os.getenv("DRONE_LAT", 0.0)),
                "longitude": float(os.getenv("DRONE_LON", 0.0)),
                "accuracy": float(score),
                "metadata": {
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                    "frame_jpeg_base64": b64_frame
                }
            }

            api_url = os.getenv("SHARK_API_URL", None)
            print(f"Sending shark detection to API: {api_url}")
            payload_log = payload.copy()
            payload_log['metadata'] = {k: v for k, v in payload['metadata'].items() if k != 'frame_jpeg_base64'}
            print(f"Payload: {json.dumps(payload_log)}")
            if api_url:
                # Try requests first, fall back to stdlib urllib if needed. Failures are ignored so video loop continues.
                try:
                    resp = requests.post(api_url, json=payload, timeout=5)
                    resp.raise_for_status()
                except Exception:
                    try:
                        import urllib.request
                        req = urllib.request.Request(api_url, data=json.dumps(payload).encode('utf-8'),
                                                    headers={'Content-Type': 'application/json'})
                        with urllib.request.urlopen(req, timeout=5) as r:
                            _ = r.read()
                    except Exception:
                        pass
        
        return frame, score
    
    def process_video(self, source=0, output=None):
        """Process video from file or camera.
        
        Args:
            source: Camera index or video file path
            output: Optional output video file path
        """
        cap = cv2.VideoCapture(source)
        if not cap.isOpened():
            raise ValueError(f"Could not open video source: {source}")
        
        # Setup video writer if output specified
        writer = None
        if output:
            fps = int(cap.get(cv2.CAP_PROP_FPS))
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            writer = cv2.VideoWriter(
                output,
                cv2.VideoWriter_fourcc(*'mp4v'),
                fps,
                (width, height)
            )
        
        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                # Process frame
                processed_frame, score = self.process_frame(frame)
                
                # Write frame if recording
                if writer:
                    writer.write(processed_frame)
                
                # Display result
                cv2.imshow('The Surfer : Shark Detector', processed_frame)
                
                # Break on 'q' key
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break
        
        finally:
            cap.release()
            if writer:
                writer.release()
            cv2.destroyAllWindows()


def main():
    parser = argparse.ArgumentParser(description="Shark detection in video.")
    parser.add_argument('--model', required=True, help='Path to model file (.h5 or .tflite)')
    parser.add_argument('--input', default=0, help='Input source (video file or camera index)')
    parser.add_argument('--output', help='Optional output video file')
    parser.add_argument('--tflite', action='store_true', help='Use TFLite model')
    parser.add_argument('--threshold', type=float, default=0.5, help='Detection threshold')
    args = parser.parse_args()
    
    try:
        # Initialize detector
        detector = SharkDetector(args.model, use_tflite=args.tflite, threshold=args.threshold)
        
        # Process video
        detector.process_video(
            source=0 if args.input == '0' else args.input,
            output=args.output
        )
    
    except KeyboardInterrupt:
        print("\nStopped by user")
        sys.exit(0)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
