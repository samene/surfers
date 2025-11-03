# The Surfer : Shark Trainer and Detector

## Train the "Shark Detector"
Use following command to train the shark model

```
# Train with transfer learning, then fine-tune the last 50 layers:
# --data_dir: path to labeled images
# --epochs: initial training epochs with the base model frozen
# --fine_tune_epochs: additional epochs after unfreezing
# --unfreeze: number of layers to unfreeze for fine-tuning
python src/shark_model_trainer.py --data_dir data --epochs 10 --fine_tune_epochs 5 --unfreeze 50

# Train only the top layers (no fine-tuning), useful for quick experiments:
# --data_dir: path to labeled images
# --epochs: training epochs with the base model frozen
python src/shark_model_trainer.py --data_dir data --epochs 10
```


## Run the "Shark Detector":
```
# Using webcam with TF model
python src/shark_detector.py --model models/best_shark_model.h5

# Using video file with tf model 
python src/shark_detector.py --model models/final_shark_mobilenetv2.h5 --input videos/shark_near_beach_360p.mp4

# Using video file with TFLite model
python src/shark_detector.py --model models/best_shark_mobilenetv2.tflite --tflite --input videos/beach.mp4

# Save output video
python src/shark_detector.py --model models/best_shark_model.h5 --input videos/beach.mp4 --output detected.mp4

# Adjust detection threshold
python src/shark_detector.py --model models/best_shark_model.h5 --threshold 0.7
```


## Dev Setup:
Run `./setup_dev` to setup the development environment which also installs all the requried libraires for this project and create folder structure to keep training data