#!/usr/bin/env python3
"""
Train shark / no_shark classifier and export models.

This script implements a training pipeline derived from `shark_detection.ipynb`.
It uses transfer learning (MobileNetV2) by default, trains a small head, optionally
fine-tunes top layers, and writes the best model to disk.

Usage examples:
  python src/shark_model_trainer.py --data_dir data --epochs 10
  python src/shark_model_trainer.py --data_dir data --epochs 10 --fine_tune_epochs 5 --unfreeze 50

Outputs:
  - models/best_shark_mobilenetv2.h5 (best during training)
  - models/final_shark_mobilenetv2.h5 (final model after fine-tuning)
"""

from pathlib import Path
import argparse
import os
import math

import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from tensorflow.keras.layers import GlobalAveragePooling2D, Dense, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau


def build_transfer_model(img_size=224, dropout=0.5):
	base = MobileNetV2(include_top=False, weights='imagenet', input_shape=(img_size, img_size, 3))
	base.trainable = False

	x = base.output
	x = GlobalAveragePooling2D()(x)
	x = Dense(128, activation='relu')(x)
	x = Dropout(dropout)(x)
	outputs = Dense(1, activation='sigmoid')(x)

	model = Model(inputs=base.input, outputs=outputs)
	model.compile(optimizer=tf.keras.optimizers.Adam(1e-4), loss='binary_crossentropy', metrics=['accuracy'])
	return model, base


def make_generators(data_dir, img_size=224, batch_size=32):
	train_dir = Path(data_dir) / 'train'
	val_dir = Path(data_dir) / 'test'

	if not train_dir.exists() or not val_dir.exists():
		raise FileNotFoundError(f"Expected data/train and data/test under {data_dir}")

	train_datagen = ImageDataGenerator(
		preprocessing_function=preprocess_input,
		rotation_range=20,
		width_shift_range=0.2,
		height_shift_range=0.2,
		horizontal_flip=True,
		fill_mode='nearest'
	)

	val_datagen = ImageDataGenerator(preprocessing_function=preprocess_input)

	train_gen = train_datagen.flow_from_directory(
		train_dir,
		target_size=(img_size, img_size),
		batch_size=batch_size,
		class_mode='binary'
	)

	val_gen = val_datagen.flow_from_directory(
		val_dir,
		target_size=(img_size, img_size),
		batch_size=batch_size,
		class_mode='binary'
	)

	return train_gen, val_gen


def train(args):
	img_size = args.img_size
	batch_size = args.batch_size
	epochs = args.epochs

	train_gen, val_gen = make_generators(args.data_dir, img_size=img_size, batch_size=batch_size)

	model, base = build_transfer_model(img_size=img_size, dropout=args.dropout)

	models_dir = Path('models')
	models_dir.mkdir(exist_ok=True)

	best_path = models_dir / 'best_shark_mobilenetv2.h5'
	final_path = models_dir / 'final_shark_mobilenetv2.h5'

	callbacks = [
		EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True),
		ModelCheckpoint(str(best_path), monitor='val_accuracy', save_best_only=True),
		ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=3, min_lr=1e-7)
	]

	steps_per_epoch = math.ceil(train_gen.samples / batch_size)
	val_steps = math.ceil(val_gen.samples / batch_size)

	history = model.fit(
		train_gen,
		epochs=epochs,
		steps_per_epoch=steps_per_epoch,
		validation_data=val_gen,
		validation_steps=val_steps,
		callbacks=callbacks
	)

	# Optionally fine-tune
	if args.fine_tune_epochs and args.unfreeze > 0:
		print(f"Starting fine-tune: unfreezing last {args.unfreeze} layers and training for {args.fine_tune_epochs} epochs")
		base.trainable = True
		# Freeze all layers except the last `unfreeze` layers
		for layer in base.layers[:-args.unfreeze]:
			layer.trainable = False

		model.compile(optimizer=tf.keras.optimizers.Adam(1e-5), loss='binary_crossentropy', metrics=['accuracy'])

		history_f = model.fit(
			train_gen,
			epochs=args.fine_tune_epochs,
			steps_per_epoch=steps_per_epoch,
			validation_data=val_gen,
			validation_steps=val_steps,
			callbacks=callbacks
		)

	# Save final model
	model.save(final_path)
	print(f"Saved final model to {final_path}")


def parse_args():
	p = argparse.ArgumentParser(description='Train shark detector using transfer learning')
	p.add_argument('--data_dir', default='data', help='Path containing train/ and test/ folders')
	p.add_argument('--img_size', type=int, default=224, help='Input image size')
	p.add_argument('--batch_size', type=int, default=32, help='Batch size')
	p.add_argument('--epochs', type=int, default=10, help='Initial training epochs')
	p.add_argument('--dropout', type=float, default=0.5, help='Dropout rate in head')
	p.add_argument('--fine_tune_epochs', type=int, default=0, help='Fine-tuning epochs (0 to skip)')
	p.add_argument('--unfreeze', type=int, default=20, help='Number of base layers to unfreeze for fine-tuning')
	return p.parse_args()


if __name__ == '__main__':
	args = parse_args()
	train(args)

