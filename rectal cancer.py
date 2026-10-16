
# ================================================================
# COLORECTAL HISTOPATHOLOGY CLASSIFICATION USING CNN
# Runs in Google Colab and VS Code
# Dataset: Zenodo 53169 - Kather colorectal histology
# Output: CNN model, metrics, plots, confusion matrix, Grad-CAM
# ================================================================

import os
import sys
import zipfile
import hashlib
import random
import subprocess
import importlib.util
from pathlib import Path

# -------------------- 1. INSTALL MISSING PACKAGES --------------------
required = {
    "numpy": "numpy",
    "PIL": "pillow",
    "sklearn": "scikit-learn",
    "matplotlib": "matplotlib",
    "seaborn": "seaborn",
    "tensorflow": "tensorflow"
}

missing = [
    package for module, package in required.items()
    if importlib.util.find_spec(module) is None
]

if missing:
    print("Installing missing packages:", missing)
    subprocess.check_call([
        sys.executable, "-m", "pip", "install", *missing
    ])

import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import tensorflow as tf

from PIL import Image
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    accuracy_score,
    precision_score,
    recall_score,
    f1_score
)
from collections import Counter

SEED = 42
random.seed(SEED)
np.random.seed(SEED)
tf.random.set_seed(SEED)

print("TensorFlow version:", tf.__version__)
print("Python version:", sys.version.split()[0])

# -------------------- 2. FIND OR UPLOAD DATASET --------------------
IS_COLAB = "google.colab" in sys.modules
WORK_DIR = Path("/content") if IS_COLAB else Path.cwd()
OUTPUT_DIR = WORK_DIR / "rectal_cancer_outputs"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff"}

def count_direct_images(folder):
    try:
        return sum(
            1 for p in folder.iterdir()
            if p.is_file() and p.suffix.lower() in IMAGE_EXTENSIONS
        )
    except Exception:
        return 0

def find_class_root(base):
    """Find a directory containing multiple class folders with images."""
    base = Path(base)
    if not base.exists():
        return None

    candidates = [base]
    try:
        candidates += [
            p for p in base.rglob("*")
            if p.is_dir()
        ]
    except Exception:
        pass

    best = None
    best_score = -1

    for folder in candidates:
        try:
            subfolders = [
                p for p in folder.iterdir()
                if p.is_dir() and count_direct_images(p) > 0
            ]
            if len(subfolders) >= 2:
                image_count = sum(count_direct_images(p) for p in subfolders)
                score = len(subfolders) * 100000 + image_count
                if score > best_score:
                    best_score = score
                    best = folder
        except Exception:
            continue

    return best

dataset_root = None

# Search already-extracted dataset folders first.
for search_base in [WORK_DIR, Path.cwd()]:
    dataset_root = find_class_root(search_base)
    if dataset_root is not None:
        break

# If not found, look for a downloaded ZIP.
if dataset_root is None:
    zip_files = list(WORK_DIR.glob("*.zip"))

    if not zip_files and IS_COLAB:
        from google.colab import files
        print("Upload your downloaded dataset ZIP file.")
        uploaded = files.upload()
        zip_files = [
            WORK_DIR / name for name in uploaded
            if name.lower().endswith(".zip")
        ]

    if zip_files:
        zip_path = zip_files[0]
        extract_dir = WORK_DIR / "colorectal_dataset_extracted"
        extract_dir.mkdir(parents=True, exist_ok=True)

        print("Extracting:", zip_path.name)
        with zipfile.ZipFile(zip_path, "r") as zf:
            zf.extractall(extract_dir)

        dataset_root = find_class_root(extract_dir)

# In VS Code, ask for the path if automatic detection failed.
if dataset_root is None and not IS_COLAB:
    entered_path = input(
        "Enter the path to your extracted dataset folder "
        "or dataset ZIP file: "
    ).strip().strip('"')

    entered_path = Path(entered_path).expanduser()

    if entered_path.is_file() and entered_path.suffix.lower() == ".zip":
        extract_dir = WORK_DIR / "colorectal_dataset_extracted"
        extract_dir.mkdir(parents=True, exist_ok=True)

        with zipfile.ZipFile(entered_path, "r") as zf:
            zf.extractall(extract_dir)

        dataset_root = find_class_root(extract_dir)

    elif entered_path.is_dir():
        dataset_root = find_class_root(entered_path)

if dataset_root is None:
    raise FileNotFoundError(
        "Could not find class folders containing images. "
        "Extract the Zenodo image-tiles ZIP and provide its folder path."
    )

print("\nDataset folder:", dataset_root)

# -------------------- 3. READ IMAGES AND LABELS --------------------
class_folders = sorted([
    p for p in dataset_root.iterdir()
    if p.is_dir() and count_direct_images(p) > 0
])

if len(class_folders) < 2:
    raise ValueError(
        "Expected class subfolders containing images. "
        "Please check the extracted dataset structure."
    )

class_names = [p.name for p in class_folders]
class_to_index = {name: i for i, name in enumerate(class_names)}

image_paths = []
labels = []

for class_folder in class_folders:
    for image_path in sorted(class_folder.iterdir()):
        if image_path.suffix.lower() in IMAGE_EXTENSIONS:
            image_paths.append(str(image_path))
            labels.append(class_to_index[class_folder.name])

print("\nClasses found:")
for name in class_names:
    print(f"  {name}: {sum(1 for p in image_paths if Path(p).parent.name == name)}")

print("Total images found:", len(image_paths))

if len(image_paths) < 20:
    raise ValueError("Too few images found. Check the dataset folder.")

# -------------------- 4. REMOVE EXACT DUPLICATE IMAGES --------------------
# Exact duplicates are removed before splitting to reduce data leakage.
unique_paths = []
unique_labels = []
seen_hashes = set()
duplicate_count = 0
bad_image_count = 0

for path, label in zip(image_paths, labels):
    try:
        with open(path, "rb") as f:
            digest = hashlib.sha256(f.read()).hexdigest()

        if digest in seen_hashes:
            duplicate_count += 1
            continue

        # Check that the image can be opened.
        with Image.open(path) as im:
            im.verify()

        seen_hashes.add(digest)
        unique_paths.append(path)
        unique_labels.append(label)

    except Exception:
        bad_image_count += 1

image_paths = np.array(unique_paths)
labels = np.array(unique_labels, dtype=np.int32)

print("\nExact duplicate files removed:", duplicate_count)
print("Unreadable files skipped:", bad_image_count)
print("Images remaining:", len(image_paths))

# -------------------- 5. STRATIFIED TRAIN / VALIDATION / TEST SPLIT --------------------
# 70% training, 15% validation, 15% testing.
# Test images are kept separate from model training and selection.

train_paths, temp_paths, train_labels, temp_labels = train_test_split(
    image_paths,
    labels,
    test_size=0.30,
    random_state=SEED,
    stratify=labels
)

val_paths, test_paths, val_labels, test_labels = train_test_split(
    temp_paths,
    temp_labels,
    test_size=0.50,
    random_state=SEED,
    stratify=temp_labels
)

print("\nDataset split:")
print(f"Training:   {len(train_paths)} images")
print(f"Validation: {len(val_paths)} images")
print(f"Testing:    {len(test_paths)} images")

# Save a manifest so you can inspect which images belong to each split.
import pandas as pd

manifest = pd.DataFrame({
    "image_path": list(train_paths) + list(val_paths) + list(test_paths),
    "label": list(train_labels) + list(val_labels) + list(test_labels),
    "split": (
        ["train"] * len(train_paths)
        + ["validation"] * len(val_paths)
        + ["test"] * len(test_paths)
    )
})
manifest["class_name"] = manifest["label"].map(
    {i: name for i, name in enumerate(class_names)}
)
manifest.to_csv(OUTPUT_DIR / "split_manifest.csv", index=False)

# -------------------- 6. BUILD TF.DATA PIPELINES --------------------
IMG_SIZE = (150, 150)
BATCH_SIZE = 32
AUTOTUNE = tf.data.AUTOTUNE
NUM_CLASSES = len(class_names)


# -------------------- 6. BUILD TF.DATA PIPELINES --------------------

import tensorflow as tf
import numpy as np
import tifffile

IMG_SIZE = (150, 150)
BATCH_SIZE = 32
AUTOTUNE = tf.data.AUTOTUNE
NUM_CLASSES = len(class_names)


def load_image(path, label):

    def read_tiff(path_bytes):
        filename = path_bytes.decode("utf-8")
        image = tifffile.imread(filename)

        # Convert grayscale to RGB
        if image.ndim == 2:
            image = np.stack([image] * 3, axis=-1)

        # Convert channel-first images to channel-last
        if image.ndim == 3 and image.shape[0] in (1, 3, 4):
            if image.shape[-1] not in (1, 3, 4):
                image = np.transpose(image, (1, 2, 0))

        # Ensure three color channels
        if image.ndim == 3 and image.shape[-1] == 1:
            image = np.repeat(image, 3, axis=-1)
        elif image.ndim == 3 and image.shape[-1] >= 3:
            image = image[:, :, :3]

        # Convert image to 8-bit format
        if image.dtype != np.uint8:
            image = np.clip(image, 0, 255).astype(np.uint8)

        return image

    image = tf.numpy_function(
        read_tiff,
        [path],
        tf.uint8
    )

    image.set_shape([None, None, 3])

    image = tf.image.resize(image, IMG_SIZE)
    image = tf.cast(image, tf.float32) / 255.0

    return image, label


def make_dataset(paths, labels_array, training=False):

    ds = tf.data.Dataset.from_tensor_slices(
        (paths, labels_array.astype(np.int32))
    )

    if training:
        ds = ds.shuffle(
            buffer_size=len(paths),
            seed=SEED,
            reshuffle_each_iteration=True
        )

    ds = ds.map(
        load_image,
        num_parallel_calls=AUTOTUNE
    )

    ds = ds.batch(BATCH_SIZE)
    return ds.prefetch(AUTOTUNE)


train_ds = make_dataset(
    train_paths, train_labels, training=True
)

val_ds = make_dataset(
    val_paths, val_labels
)

test_ds = make_dataset(
    test_paths, test_labels
)

# -------------------- 7. DISPLAY CLASS DISTRIBUTION --------------------
counts = Counter(labels)
plt.figure(figsize=(11, 4))
plt.bar(
    [class_names[i] for i in range(NUM_CLASSES)],
    [counts[i] for i in range(NUM_CLASSES)]
)
plt.title("Dataset Class Distribution")
plt.xlabel("Tissue class")
plt.ylabel("Number of images")
plt.xticks(rotation=35, ha="right")
plt.tight_layout()
plt.savefig(OUTPUT_DIR / "class_distribution.png", dpi=150)
plt.show()

# -------------------- 8. CNN MODEL WITH AUGMENTATION AND BATCH NORM --------------------
data_augmentation = tf.keras.Sequential([
    tf.keras.layers.RandomFlip("horizontal_and_vertical"),
    tf.keras.layers.RandomRotation(0.08),
    tf.keras.layers.RandomZoom(0.10)
], name="data_augmentation")

inputs = tf.keras.Input(shape=(150, 150, 3))
x = data_augmentation(inputs)

x = tf.keras.layers.Conv2D(
    32, 3, padding="same", activation="relu"
)(x)
x = tf.keras.layers.BatchNormalization()(x)
x = tf.keras.layers.MaxPooling2D()(x)

x = tf.keras.layers.Conv2D(
    64, 3, padding="same", activation="relu"
)(x)
x = tf.keras.layers.BatchNormalization()(x)
x = tf.keras.layers.MaxPooling2D()(x)

x = tf.keras.layers.Conv2D(
    128, 3, padding="same", activation="relu"
)(x)
x = tf.keras.layers.BatchNormalization()(x)
x = tf.keras.layers.MaxPooling2D()(x)

x = tf.keras.layers.Conv2D(
    256, 3, padding="same", activation="relu"
)(x)
x = tf.keras.layers.BatchNormalization()(x)
x = tf.keras.layers.GlobalAveragePooling2D()(x)

x = tf.keras.layers.Dense(128, activation="relu")(x)
x = tf.keras.layers.Dropout(0.40)(x)

outputs = tf.keras.layers.Dense(
    NUM_CLASSES, activation="softmax", name="predictions"
)(x)

model = tf.keras.Model(inputs, outputs, name="Colorectal_Histology_CNN")

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
    loss="sparse_categorical_crossentropy",
    metrics=["accuracy"]
)

model.summary()

# -------------------- 9. TRAIN CNN --------------------
callbacks = [
    tf.keras.callbacks.ModelCheckpoint(
        str(OUTPUT_DIR / "best_rectal_cancer_model.keras"),
        monitor="val_loss",
        save_best_only=True,
        verbose=1
    ),
    tf.keras.callbacks.EarlyStopping(
        monitor="val_loss",
        patience=7,
        restore_best_weights=True,
        verbose=1
    ),
    tf.keras.callbacks.ReduceLROnPlateau(
        monitor="val_loss",
        factor=0.5,
        patience=3,
        min_lr=1e-6,
        verbose=1
    )
]

EPOCHS = 30

# Changed verbose to 2 to output only one line per epoch and avoid cell truncation
history = model.fit(
    train_ds,
    validation_data=val_ds,
    epochs=EPOCHS,
    callbacks=callbacks,
    verbose=2
)

# Load the best saved model.
model = tf.keras.models.load_model(
    OUTPUT_DIR / "best_rectal_cancer_model.keras"
)

# -------------------- 10. ACCURACY AND LOSS GRAPHS --------------------
fig, axes = plt.subplots(1, 2, figsize=(12, 4))

axes[0].plot(history.history["accuracy"], label="Training")
axes[0].plot(history.history["val_accuracy"], label="Validation")
axes[0].set_title("Model Accuracy")
axes[0].set_xlabel("Epoch")
axes[0].set_ylabel("Accuracy")
axes[0].legend()

axes[1].plot(history.history["loss"], label="Training")
axes[1].plot(history.history["val_loss"], label="Validation")
axes[1].set_title("Model Loss")
axes[1].set_xlabel("Epoch")
axes[1].set_ylabel("Loss")
axes[1].legend()

plt.tight_layout()
plt.savefig(OUTPUT_DIR / "training_accuracy_loss.png", dpi=150)
plt.show()

# -------------------- 11. FINAL TEST EVALUATION --------------------
test_probabilities = model.predict(test_ds, verbose=0)
predicted_labels = np.argmax(test_probabilities, axis=1)

test_accuracy = accuracy_score(test_labels, predicted_labels)
test_precision = precision_score(
    test_labels, predicted_labels,
    average="macro", zero_division=0
)
test_recall = recall_score(
    test_labels, predicted_labels,
    average="macro", zero_division=0
)
test_f1 = f1_score(
    test_labels, predicted_labels,
    average="macro", zero_division=0
)

print("\n========== FINAL TEST RESULTS ==========")
print(f"Test Accuracy:          {test_accuracy:.4f}")
print(f"Macro Precision:        {test_precision:.4f}")
print(f"Macro Recall:           {test_recall:.4f}")
print(f"Macro F1-score:         {test_f1:.4f}")

report = classification_report(
    test_labels,
    predicted_labels,
    labels=list(range(NUM_CLASSES)),
    target_names=class_names,
    zero_division=0
)
print("\nClassification Report:\n")
print(report)

with open(OUTPUT_DIR / "classification_report.txt", "w") as f:
    f.write(report)

pd.DataFrame([{
    "test_accuracy": test_accuracy,
    "macro_precision": test_precision,
    "macro_recall": test_recall,
    "macro_f1": test_f1
}]).to_csv(OUTPUT_DIR / "test_metrics.csv", index=False)

# -------------------- 12. CONFUSION MATRIX --------------------
cm = confusion_matrix(
    test_labels, predicted_labels,
    labels=list(range(NUM_CLASSES))
)

plt.figure(figsize=(10, 8))
sns.heatmap(
    cm, annot=True, fmt="d", cmap="Blues",
    xticklabels=class_names, yticklabels=class_names
)
plt.title("CNN Test Confusion Matrix")
plt.xlabel("Predicted class")
plt.ylabel("Actual class")
plt.xticks(rotation=40, ha="right")
plt.yticks(rotation=0)
plt.tight_layout()
plt.savefig(OUTPUT_DIR / "confusion_matrix.png", dpi=150)
plt.show()

# -------------------- 13. SAMPLE PREDICTIONS --------------------
sample_count = min(12, len(test_paths))
sample_indices = np.random.choice(
    len(test_paths), sample_count, replace=False
)

fig, axes = plt.subplots(3, 4, figsize=(14, 10))
axes = axes.flatten()

for ax, idx in zip(axes, sample_indices):
    with Image.open(test_paths[idx]) as im:
        image = im.convert("RGB").resize(IMG_SIZE)
        image_array = np.asarray(image) / 255.0

    probs = model.predict(
        np.expand_dims(image_array, axis=0), verbose=0
    )[0]
    pred = int(np.argmax(probs))
    actual = int(test_labels[idx])

    ax.imshow(image_array)
    ax.set_title(
        f"Actual: {class_names[actual]}\n"
        f"Predicted: {class_names[pred]} ({probs[pred]:.2f})",
        color="green" if actual == pred else "red",
        fontsize=9
    )
    ax.axis("off")

for ax in axes[sample_count:]:
    ax.axis("off")

plt.tight_layout()
plt.savefig(OUTPUT_DIR / "sample_predictions.png", dpi=150)
plt.show()

# -------------------- 14. GRAD-CAM EXPLANATION --------------------
# Grad-CAM is an approximate visual explanation, not a medical diagnosis.

def make_gradcam_heatmap(image_batch, trained_model, last_conv_layer_name):
    grad_model = tf.keras.models.Model(
        trained_model.inputs,
        [
            trained_model.get_layer(last_conv_layer_name).output,
            trained_model.output
        ]
    )

    with tf.GradientTape() as tape:
        conv_outputs, predictions = grad_model(image_batch)
        class_index = tf.argmax(predictions[0])
        class_score = predictions[:, class_index]

    grads = tape.gradient(class_score, conv_outputs)
    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))
    conv_outputs = conv_outputs[0]

    heatmap = tf.reduce_sum(
        conv_outputs * pooled_grads, axis=-1
    )
    heatmap = tf.maximum(heatmap, 0)
    heatmap = heatmap / (tf.reduce_max(heatmap) + 1e-8)

    return heatmap.numpy()

try:
    last_conv_name = [
        layer.name for layer in model.layers
        if isinstance(layer, tf.keras.layers.Conv2D)
    ][-1]

    grad_path = test_paths[int(sample_indices[0])]
    with Image.open(grad_path) as im:
        grad_image = im.convert("RGB").resize(IMG_SIZE)
        grad_array = np.asarray(grad_image).astype(np.float32) / 255.0

    heatmap = make_gradcam_heatmap(
        np.expand_dims(grad_array, axis=0),
        model,
        last_conv_name
    )

    plt.figure(figsize=(10, 4))

    plt.subplot(1, 2, 1)
    plt.imshow(grad_array)
    plt.title("Original Histology Image")
    plt.axis("off")

    plt.subplot(1, 2, 2)
    plt.imshow(grad_array)
    plt.imshow(
        tf.image.resize(
            heatmap[..., np.newaxis], IMG_SIZE
        ).numpy().squeeze(),
        cmap="jet", alpha=0.4
    )
    plt.title("Grad-CAM Attention Map")
    plt.axis("off")

    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / "gradcam.png", dpi=150)
    plt.show()

except Exception as e:
    print("Grad-CAM could not be generated:", e)

# -------------------- 15. SAVE MODEL AND SUMMARY --------------------
model.save(OUTPUT_DIR / "final_rectal_cancer_model.keras")

print("\n========== COMPLETED ==========")
print("Model and results saved in:")
print(OUTPUT_DIR.resolve())

print("\nOutput files:")
for file_path in sorted(OUTPUT_DIR.iterdir()):
    print(" -", file_path.name)

print(
    "\nNote: This model classifies colorectal tissue image classes. "
    "It is an educational research model, not a clinical diagnostic system."
)
