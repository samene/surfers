# Sharks Module Architecture

Last updated: 2025-11-03

## Purpose

This document describes the architecture of the `sharks` subsystem, which provides training, model export, and real-time inference for a binary shark / no-shark classifier used by drone and desktop video pipelines.

## High-level components

- Training pipeline (`src/shark_model_trainer.py`)
  - Performs transfer learning using MobileNetV2 (imagenet weights) as backbone.
  - Produces two model artifacts: `models/best_shark_mobilenetv2.h5` (best) and `models/final_shark_mobilenetv2.h5` (final after optional fine-tuning).
  - Expects data under `data/train/` and `data/test/` with folder-per-class structure (ImageDataGenerator).
  - Preprocessing: `tensorflow.keras.applications.mobilenet_v2.preprocess_input`.
  - Output: single-unit sigmoid (binary classification).

- Desktop / Drone inference (`src/shark_detector.py`)
  - `SharkDetector` class handles both normal TF `.h5` models and TFLite `.tflite` models.
  - Preprocess: resize to 224x224, RGB, normalize (float32 / 255.0 or mobilenet preprocess depending on training pipeline).
  - Behavior on detection: visual overlay, optional API POST to `SHARK_API_URL` including base64 JPEG frame, environmental metadata (env vars `DRONE_NAME`, `DRONE_LAT`, `DRONE_LON`).
  - Can stream from webcam or process video files; optional output video recording.

- Drone-optimized inference & clip saving (`src/drone_inference_tflite.py`)
  - Built around TFLite interpreter for on-device inference.
  - Maintains a circular buffer of pre-trigger frames and saves buffer + post-trigger frames to disk when detection score exceeds threshold.
  - Writes a `detections.json` log with GPS (stubbed `get_gps()` — replace with MAVLink/gpsd client on drone) and clip paths.
  - Command-line driven: accepts `--model` (tflite), `--camera` (index or video file), buffer and post-trigger sizes, FPS, output directory.

## Files and responsibilities

- `src/shark_model_trainer.py`
  - Build training generators (data augmentation), construct MobileNetV2-based model, train and optionally fine-tune, save best + final models in `models/`.

- `src/shark_detector.py`
  - `SharkDetector` class: init, TF/TFLite loading, preprocess, predict, process_frame, process_video, and CLI `main()`.
  - Sends detection payloads to an API if `SHARK_API_URL` is set (uses `requests`, falls back to urllib).

- `src/drone_inference_tflite.py`
  - Minimal TFLite inference example for continuous drone-based processing; saves detection clips and JSON logs.

- `models/` (artifacts produced/used, not always committed)
  - `best_shark_mobilenetv2.h5` — saved by trainer as best checkpoint
  - `final_shark_mobilenetv2.h5` — final model after training/fine-tuning
  - Potential `.tflite` converted models (not produced by current scripts — see Conversion section below)

- `data/` (training data expected structure)
  - `data/train/<class>/*` and `data/test/<class>/*`

## Data flow

1. Training
   - Input: labeled images in `data/train` and `data/test`.
   - Process: ImageDataGenerator -> MobileNetV2 base (frozen) -> head (128-d -> dropout -> sigmoid) -> train.
   - Output: `.h5` Keras model(s).

2. Model conversion (optional)
   - For drone/embedded inference prefer TFLite: convert the `.h5` (Keras) to `.tflite` using the official TF converter.
   - Minimal conversion example (run in Python with TensorFlow available):

     ```py
     import tensorflow as tf
     model = tf.keras.models.load_model('models/final_shark_mobilenetv2.h5', compile=False)
     converter = tf.lite.TFLiteConverter.from_keras_model(model)
     converter.optimizations = [tf.lite.Optimize.DEFAULT]
     tflite_model = converter.convert()
     open('models/best_shark_mobilenetv2.tflite', 'wb').write(tflite_model)
     ```

   - Consider post-training quantization (float16 or int8) for edge devices.

3. Inference
   - Input: video frames from camera or file.
   - Preprocess: resize -> RGB -> normalization -> batch dim.
   - Inference: TF `.predict()` or TFLite interpreter invoke.
   - Postprocess: threshold score -> actions (visual overlay, save clip, send API payload, logging).

## Runtime and deployment recommendations

- Development (desktop): use `tensorflow` (full) with GPU if available to speed up model training and TF inference.
- Edge / Drone: use `tflite-runtime` or TF Lite with model converted to `.tflite`. Prefer quantized `.tflite` model for CPU-bound drones.
- For real drones integrate GPS via MAVLink (`pymavlink`) or `gpsd`; replace the `get_gps()` stub in `drone_inference_tflite.py`.
- Ensure a robust logging mechanism and persistent storage for clips. Keep disk I/O async if possible to not block inference loop.

## Dependencies

- Required (runtime):
  - Python 3.8+
  - opencv-python (cv2)
  - numpy
  - tensorflow (for training & desktop inference) or tflite-runtime (for lightweight devices)
  - requests (for API posting)

- Optional (drone telemetry / GPS):
  - pymavlink or gpsd client

- Example minimal pip requirements (project-level, create as needed):

  - For training / dev: tensorflow, opencv-python, numpy, requests
  - For edge runtime: tflite-runtime, opencv-python, numpy

## Configuration & Environment

- CLI arguments used by scripts (examples):
  - Trainer: `--data_dir`, `--img_size`, `--batch_size`, `--epochs`, `--fine_tune_epochs`, `--unfreeze`
  - Detector: `--model` (path), `--input` (video source), `--output` (optional), `--tflite`, `--threshold`
  - Drone inference: `--model` (.tflite), `--camera`, `--buffer-size`, `--post-trigger`, `--output-dir`, `--fps`

- Environment variables referenced by `shark_detector.py`:
  - `SHARK_API_URL` — optional endpoint to POST detection payloads
  - `DRONE_NAME`, `DRONE_LAT`, `DRONE_LON` — used to populate payload metadata when available

## API payload (as used in `shark_detector.py`)

When a high-confidence detection is made, a payload similar to this is created:

- Keys: droneName, sharkType, size, lattitude (sic), longitude, accuracy, metadata
- `metadata.timestamp` is UTC ISO timestamp with trailing Z
- `metadata.frame_jpeg_base64` contains a base64-encoded JPEG of the frame

Notes: The code has `lattitude` typo and includes `size` and `sharkType` as placeholders — modify payload schema as needed to match the server API.

## Quality, performance and edge cases

- Edge cases to consider:
  - Empty camera feed or disconnects -> handled partially by checks (`cap.isOpened()`, `ret`) but should implement reconnect/backoff.
  - Missing model file -> code raises FileNotFoundError; ensure CI and deployment bundle models or add download step.
  - API failures -> current implementation swallows exceptions to avoid stopping the video loop; consider exponential backoff and persistent queueing.
  - GPS missing on drone -> current get_gps() returns nulls; replace with actual telemetry.

- Performance tips:
  - Run inference on a reduced frame-rate or run every Nth frame to save CPU.
  - Use TFLite with quantization for CPU-only devices.
  - Offload clip encoding to a background thread or process to avoid blocking inference.

## How to run (examples)

- Train (desktop with TF):

  ```bash
  python3 src/shark_model_trainer.py --data_dir data --epochs 10
  ```

- Convert to TFLite (optional): see conversion snippet above.

- Run desktop detector (using `.h5` TF model):

  ```bash
  python3 src/shark_detector.py --model models/final_shark_mobilenetv2.h5 --input videos/beach.mp4
  ```

- Run TFLite drone-style inference (save clips on detection):

  ```bash
  python3 src/drone_inference_tflite.py --model models/best_shark_mobilenetv2.tflite --camera 0 --output-dir detections
  ```