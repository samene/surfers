#!/usr/bin/env python3
"""
Drone inference script for TFLite model.
- Loads a TFLite model and runs inference on incoming frames.
- Maintains a short circular buffer of frames; when detection confidence > threshold,
  saves buffer + next N frames to disk as a short clip and logs a JSON with GPS.

Requirements:
- tflite-runtime or TensorFlow with tflite interpreter
- OpenCV
- numpy
- optional: pymavlink or other GPS source

Usage example:
python3 drone_inference_tflite.py --model models/best_shark_mobilenetv2.tflite --camera 0
python3 drone_inference_tflite.py --model models/best_shark_mobilenetv2.tflite --camera videos/Grate_White_Shark_Near_beach_360p.mp4

Note: On real drones, replace `get_gps()` implementation with your flight controller
telemetry (MAVLink) or GPS module.
"""

import argparse
import time
import json
import os
from collections import deque
from datetime import datetime

import cv2
import numpy as np

try:
    import tflite_runtime.interpreter as tflite
except Exception:
    import tensorflow as tf
    tflite = tf.lite


# Placeholder GPS getter: replace with real GPS/MAVLink code on the drone
def get_gps():
    # Return (lat, lon, alt) or None if unavailable
    # Replace this with pymavlink or gpsd client to read actual position
    return {'lat': None, 'lon': None, 'alt': None}


def load_tflite_model(model_path):
    interpreter = tflite.Interpreter(model_path=model_path)
    interpreter.allocate_tensors()
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()
    return interpreter, input_details, output_details


def preprocess_frame_for_tflite(frame, input_shape, preprocess_type='default'):
    # input_shape: (1, H, W, C)
    h, w = input_shape[1], input_shape[2]
    img = cv2.resize(frame, (w, h))
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img = img_rgb.astype(np.float32)
    if preprocess_type == 'mobilenetv2':
        from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
        img = preprocess_input(img)
    else:
        img = img / 255.0
    # Check input dtype
    return np.expand_dims(img, axis=0)


def run_inference(interpreter, input_details, output_details, prepped):
    interpreter.set_tensor(input_details[0]['index'], prepped.astype(input_details[0]['dtype']))
    interpreter.invoke()
    output_data = interpreter.get_tensor(output_details[0]['index'])
    # Assuming output is single sigmoid probability
    score = float(output_data.ravel()[0])
    return score


def save_clip(frames, out_path, fps=10):
    if not frames:
        return
    h, w = frames[0].shape[:2]
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    writer = cv2.VideoWriter(out_path, fourcc, fps, (w, h))
    for f in frames:
        writer.write(f)
    writer.release()


def main(args):
    interpreter, input_details, output_details = load_tflite_model(args.model)
    input_shape = input_details[0]['shape']

    # Circular buffer to store recent frames (store raw BGR frames)
    buffer = deque(maxlen=args.buffer_size)

    cap = cv2.VideoCapture(args.camera)
    if not cap.isOpened():
        print('Error: cannot open camera/file')
        return

    post_trigger_frames = args.post_trigger
    triggered = False
    post_count = 0

    detection_log = []
    clip_idx = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        buffer.append(frame.copy())

        # Run inference every N frames to save CPU if desired
        # For now run every frame
        prepped = preprocess_frame_for_tflite(frame, input_shape, preprocess_type=args.preprocess)
        score = run_inference(interpreter, input_details, output_details, prepped)

        # Visual overlay
        label = f"Shark: {score:.2f}"
        color = (0, 0, 255) if score > args.threshold else (0, 255, 0)
        cv2.putText(frame, label, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, color, 2)

        cv2.imshow('Drone Shark Detection', frame)

        if score > args.threshold and not triggered:
            print(f"Trigger at {datetime.utcnow().isoformat()} score={score:.3f}")
            triggered = True
            post_count = 0
            # Save the buffer + upcoming frames after trigger
            clip_frames = list(buffer)
            # Continue collecting post_trigger_frames
        if triggered:
            post_count += 1
            clip_frames.append(frame.copy())
            if post_count >= post_trigger_frames:
                # Save clip
                ts = datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')
                clip_name = f"detection_clip_{ts}_{clip_idx}.mp4"
                clip_path = os.path.join(args.output_dir, clip_name)
                save_clip(clip_frames, clip_path, fps=args.fps)

                gps = get_gps()
                log_entry = {
                    'timestamp_utc': ts,
                    'clip': clip_path,
                    'score': float(score),
                    'gps': gps
                }
                detection_log.append(log_entry)
                # write log to file
                log_file = os.path.join(args.output_dir, 'detections.json')
                with open(log_file, 'w') as lf:
                    json.dump(detection_log, lf, indent=2)

                print(f"Saved clip {clip_path}")
                clip_idx += 1
                triggered = False
                clip_frames = []

        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('--model', required=True, help='Path to .tflite model')
    p.add_argument('--camera', default=0, help='Camera index or video file')
    p.add_argument('--threshold', type=float, default=0.5, help='Detection threshold')
    p.add_argument('--buffer-size', type=int, default=50, help='Pre-trigger buffer size (frames)')
    p.add_argument('--post-trigger', type=int, default=30, help='Frames to record after trigger')
    p.add_argument('--output-dir', default='detections', help='Directory to save clips and logs')
    p.add_argument('--fps', type=int, default=10, help='FPS for saved clips')
    p.add_argument('--preprocess', choices=['default', 'mobilenetv2'], default='mobilenetv2', help='Preprocessing type')
    args = p.parse_args()

    os.makedirs(args.output_dir, exist_ok=True)
    main(args)
