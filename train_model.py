"""
Train colorectal cancer model using the exact architecture and preprocessing from rectal cancer.py.
Saves weights to rectal_cancer_outputs/best_rectal_cancer_model.keras.
"""
import os
import random
from pathlib import Path
import numpy as np
import tifffile
from PIL import Image
from sklearn.model_selection import train_test_split
import tensorflow as tf

SEED = 42
random.seed(SEED)
np.random.seed(SEED)
tf.random.set_seed(SEED)

WORK_DIR = Path(__file__).resolve().parent
DATASET_DIR = WORK_DIR / "dataset"
OUTPUT_DIR = WORK_DIR / "rectal_cancer_outputs"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

IMG_SIZE = (150, 150)
BATCH_SIZE = 16

class_folders = sorted([p for p in DATASET_DIR.iterdir() if p.is_dir()])
class_names = [p.name for p in class_folders]
class_to_index = {name: i for i, name in enumerate(class_names)}
NUM_CLASSES = len(class_names)

print(f"Detected {NUM_CLASSES} classes: {class_names}")

image_paths = []
labels = []
for c_folder in class_folders:
    for f in sorted(c_folder.iterdir()):
        if f.suffix.lower() in {".tif", ".tiff", ".jpg", ".jpeg", ".png"}:
            image_paths.append(str(f))
            labels.append(class_to_index[c_folder.name])

image_paths = np.array(image_paths)
labels = np.array(labels, dtype=np.int32)
print(f"Total dataset images loaded: {len(image_paths)}")

train_paths, temp_paths, train_labels, temp_labels = train_test_split(
    image_paths, labels, test_size=0.30, random_state=SEED, stratify=labels
)
val_paths, test_paths, val_labels, test_labels = train_test_split(
    temp_paths, temp_labels, test_size=0.50, random_state=SEED, stratify=temp_labels
)

print(f"Train: {len(train_paths)}, Val: {len(val_paths)}, Test: {len(test_paths)}")

def read_tiff_or_img(path_bytes):
    filename = path_bytes.decode("utf-8")
    try:
        image = tifffile.imread(filename)
    except Exception:
        with Image.open(filename) as im:
            image = np.array(im.convert("RGB"))
    
    if image.ndim == 2:
        image = np.stack([image] * 3, axis=-1)
    if image.ndim == 3 and image.shape[0] in (1, 3, 4) and image.shape[-1] not in (1, 3, 4):
        image = np.transpose(image, (1, 2, 0))
    if image.ndim == 3 and image.shape[-1] == 1:
        image = np.repeat(image, 3, axis=-1)
    elif image.ndim == 3 and image.shape[-1] >= 3:
        image = image[:, :, :3]
    if image.dtype != np.uint8:
        image = np.clip(image, 0, 255).astype(np.uint8)
    return image

def load_image(path, label):
    image = tf.numpy_function(read_tiff_or_img, [path], tf.uint8)
    image.set_shape([None, None, 3])
    image = tf.image.resize(image, IMG_SIZE)
    image = tf.cast(image, tf.float32) / 255.0
    return image, label

def make_dataset(paths, labels_arr, training=False):
    ds = tf.data.Dataset.from_tensor_slices((paths, labels_arr.astype(np.int32)))
    if training:
        ds = ds.shuffle(buffer_size=len(paths), seed=SEED, reshuffle_each_iteration=True)
    ds = ds.map(load_image, num_parallel_calls=tf.data.AUTOTUNE)
    ds = ds.batch(BATCH_SIZE)
    return ds.prefetch(tf.data.AUTOTUNE)

train_ds = make_dataset(train_paths, train_labels, training=True)
val_ds = make_dataset(val_paths, val_labels)
test_ds = make_dataset(test_paths, test_labels)

# Architecture identical to rectal cancer.py
data_augmentation = tf.keras.Sequential([
    tf.keras.layers.RandomFlip("horizontal_and_vertical"),
    tf.keras.layers.RandomRotation(0.08),
    tf.keras.layers.RandomZoom(0.10)
], name="data_augmentation")

inputs = tf.keras.Input(shape=(150, 150, 3))
x = data_augmentation(inputs)

x = tf.keras.layers.Conv2D(32, 3, padding="same", activation="relu")(x)
x = tf.keras.layers.BatchNormalization()(x)
x = tf.keras.layers.MaxPooling2D()(x)

x = tf.keras.layers.Conv2D(64, 3, padding="same", activation="relu")(x)
x = tf.keras.layers.BatchNormalization()(x)
x = tf.keras.layers.MaxPooling2D()(x)

x = tf.keras.layers.Conv2D(128, 3, padding="same", activation="relu")(x)
x = tf.keras.layers.BatchNormalization()(x)
x = tf.keras.layers.MaxPooling2D()(x)

x = tf.keras.layers.Conv2D(256, 3, padding="same", activation="relu")(x)
x = tf.keras.layers.BatchNormalization()(x)
x = tf.keras.layers.GlobalAveragePooling2D()(x)

x = tf.keras.layers.Dense(128, activation="relu")(x)
x = tf.keras.layers.Dropout(0.40)(x)

outputs = tf.keras.layers.Dense(NUM_CLASSES, activation="softmax", name="predictions")(x)
model = tf.keras.Model(inputs, outputs, name="Colorectal_Histology_CNN")

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
    loss="sparse_categorical_crossentropy",
    metrics=["accuracy"]
)

model_path = OUTPUT_DIR / "best_rectal_cancer_model.keras"
callbacks = [
    tf.keras.callbacks.ModelCheckpoint(
        str(model_path),
        monitor="val_loss",
        save_best_only=True,
        verbose=1
    )
]

print("Starting training (5 epochs)...")
history = model.fit(
    train_ds,
    validation_data=val_ds,
    epochs=5,
    callbacks=callbacks,
    verbose=1
)

model.save(str(OUTPUT_DIR / "final_rectal_cancer_model.keras"))
print("Training completed successfully! Saved models:")
print(f" - {model_path}")
print(f" - {OUTPUT_DIR / 'final_rectal_cancer_model.keras'}")
