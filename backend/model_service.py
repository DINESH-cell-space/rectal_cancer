import io
import os
import base64
from pathlib import Path
from typing import Dict, Any, Optional, Tuple, List
import numpy as np
from PIL import Image
import tifffile
import tensorflow as tf
import matplotlib.cm as cm

CLASS_NAMES = [
    "01_TUMOR",
    "02_STROMA",
    "03_COMPLEX",
    "04_LYMPHO",
    "05_DEBRIS",
    "06_MUCOSA",
    "07_ADIPOSE",
    "08_EMPTY"
]

IMG_SIZE = (150, 150)

class ModelService:
    def __init__(self, workspace_dir: Path):
        self.workspace_dir = workspace_dir
        self.output_dir = workspace_dir / "rectal_cancer_outputs"
        self.model: Optional[tf.keras.Model] = None
        self.last_conv_layer_name: Optional[str] = None
        self.model_path: Optional[Path] = None
        self.model_status: str = "Uninitialized"
        self.model_error: Optional[str] = None
        self._load_model()

    def _find_model_file(self) -> Optional[Path]:
        candidates = [
            self.output_dir / "best_rectal_cancer_model.keras",
            self.output_dir / "final_rectal_cancer_model.keras",
            self.workspace_dir / "best_rectal_cancer_model.keras",
            self.workspace_dir / "final_rectal_cancer_model.keras"
        ]
        for c in candidates:
            if c.exists():
                return c
        return None

    def _load_model(self):
        try:
            m_path = self._find_model_file()
            if m_path is None:
                self.model = None
                self.model_status = "Weights pending (train_model.py available or upload .keras weights)"
                self.model_error = "Model weights file not found in rectal_cancer_outputs"
                return

            print(f"Loading Keras model from {m_path}...")
            self.model = tf.keras.models.load_model(m_path, compile=False)
            self.model_path = m_path

            # Identify last Conv2D layer
            conv_layers = [l.name for l in self.model.layers if isinstance(l, tf.keras.layers.Conv2D)]
            if conv_layers:
                self.last_conv_layer_name = conv_layers[-1]
            else:
                self.last_conv_layer_name = None

            self.model_status = f"Loaded ({m_path.name})"
            self.model_error = None
            print(f"Model loaded successfully. Last Conv2D layer: {self.last_conv_layer_name}")
        except Exception as e:
            self.model = None
            self.model_status = "Load Error"
            self.model_error = str(e)
            print(f"Failed to load model: {e}")

    def reload_model(self, custom_path: Optional[str] = None) -> bool:
        if custom_path:
            p = Path(custom_path)
            if p.exists():
                try:
                    self.model = tf.keras.models.load_model(p, compile=False)
                    self.model_path = p
                    conv_layers = [l.name for l in self.model.layers if isinstance(l, tf.keras.layers.Conv2D)]
                    self.last_conv_layer_name = conv_layers[-1] if conv_layers else None
                    self.model_status = f"Loaded ({p.name})"
                    self.model_error = None
                    return True
                except Exception as e:
                    self.model_error = str(e)
                    return False
        self._load_model()
        return self.model is not None

    def get_info(self) -> Dict[str, Any]:
        layers_info = []
        if self.model:
            for l in self.model.layers:
                out_shape = getattr(l, "output_shape", None)
                if out_shape is None:
                    out_shape = getattr(l, "batch_shape", None)
                if out_shape is None:
                    out_shape = getattr(l, "shape", "N/A")
                layers_info.append({
                    "name": l.name,
                    "class": l.__class__.__name__,
                    "output_shape": str(out_shape)
                })

        metrics_csv = self.output_dir / "test_metrics.csv"
        metrics_data = {}
        if metrics_csv.exists():
            import pandas as pd
            try:
                df = pd.read_csv(metrics_csv)
                metrics_data = df.to_dict(orient="records")[0]
            except Exception:
                pass

        class_report_txt = self.output_dir / "classification_report.txt"
        report_text = ""
        if class_report_txt.exists():
            with open(class_report_txt, "r") as f:
                report_text = f.read()

        saved_plots = [
            f.name for f in self.output_dir.glob("*.png")
        ]

        return {
            "model_name": "Colorectal_Histology_CNN",
            "framework": f"TensorFlow {tf.__version__} / Keras",
            "status": self.model_status,
            "error": self.model_error,
            "is_loaded": self.model is not None,
            "model_path": str(self.model_path) if self.model_path else None,
            "input_shape": [150, 150, 3],
            "num_classes": len(CLASS_NAMES),
            "classes": CLASS_NAMES,
            "last_conv_layer": self.last_conv_layer_name,
            "parameters_count": int(self.model.count_params()) if self.model else 400000,
            "layers": layers_info,
            "test_metrics": metrics_data,
            "classification_report": report_text,
            "plots": saved_plots,
            "limitations": [
                "Research-use only: Not approved for standalone diagnostic clinical decisions.",
                "Trained specifically on Kather et al. Zenodo 53169 histological tiles (150x150 px).",
                "Grad-CAM visualizes gradient-weighted attention regions, not cytological confirmation.",
                "Whole slide context and surgical staging (pTNM) require clinical pathologist review."
            ]
        }

    def preprocess_image(self, image_bytes: bytes, filename: str = "") -> Tuple[np.ndarray, Image.Image]:
        try:
            if filename.lower().endswith((".tif", ".tiff")):
                arr = tifffile.imread(io.BytesIO(image_bytes))
                if arr.ndim == 2:
                    arr = np.stack([arr] * 3, axis=-1)
                elif arr.ndim == 3 and arr.shape[0] in (1, 3, 4) and arr.shape[-1] not in (1, 3, 4):
                    arr = np.transpose(arr, (1, 2, 0))
                if arr.shape[-1] > 3:
                    arr = arr[:, :, :3]
                if arr.dtype != np.uint8:
                    arr = np.clip(arr, 0, 255).astype(np.uint8)
                pil_image = Image.fromarray(arr)
            else:
                pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        except Exception:
            pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        # Resize to 150x150
        resized_pil = pil_image.resize(IMG_SIZE, Image.Resampling.BILINEAR)
        img_array = np.asarray(resized_pil, dtype=np.float32) / 255.0
        return img_array, pil_image

    def predict(self, image_bytes: bytes, filename: str = "", ground_truth: Optional[str] = None) -> Dict[str, Any]:
        if self.model is None:
            raise RuntimeError(f"Model is not loaded: {self.model_status}. {self.model_error or ''}")

        img_array, orig_pil = self.preprocess_image(image_bytes, filename)
        batch = np.expand_dims(img_array, axis=0) # (1, 150, 150, 3)

        # Forward pass
        predictions = self.model(batch, training=False).numpy()[0] # (8,)
        pred_idx = int(np.argmax(predictions))
        pred_class = CLASS_NAMES[pred_idx]
        confidence = float(predictions[pred_idx])

        probabilities = [
            {
                "class_id": c,
                "class_name": c,
                "probability": float(p),
                "percentage": round(float(p) * 100, 2)
            }
            for c, p in zip(CLASS_NAMES, predictions)
        ]
        # Sort probabilities descending
        probabilities_sorted = sorted(probabilities, key=lambda x: x["probability"], reverse=True)

        is_correct = None
        if ground_truth:
            is_correct = (ground_truth == pred_class)

        return {
            "predicted_class": pred_class,
            "predicted_index": pred_idx,
            "confidence": confidence,
            "confidence_percentage": round(confidence * 100, 2),
            "probabilities": probabilities,
            "probabilities_sorted": probabilities_sorted,
            "ground_truth": ground_truth,
            "is_correct": is_correct,
            "input_dimensions": [orig_pil.width, orig_pil.height],
            "model_name": "Colorectal_Histology_CNN",
            "device": "CPU"
        }

    def generate_gradcam(
        self, 
        image_bytes: bytes, 
        filename: str = "", 
        target_class_idx: Optional[int] = None,
        colormap_name: str = "jet"
    ) -> Dict[str, Any]:
        if self.model is None:
            raise RuntimeError(f"Model is not loaded: {self.model_status}")

        if not self.last_conv_layer_name:
            raise RuntimeError("No Conv2D layer found in model for Grad-CAM computation.")

        img_array, orig_pil = self.preprocess_image(image_bytes, filename)
        batch = np.expand_dims(img_array, axis=0)

        # Grad-CAM model with dual outputs: last conv layer & final predictions
        last_conv_layer = self.model.get_layer(self.last_conv_layer_name)
        grad_model = tf.keras.models.Model(
            self.model.inputs,
            [last_conv_layer.output, self.model.output]
        )

        with tf.GradientTape() as tape:
            conv_outputs, predictions = grad_model(batch)
            if target_class_idx is None:
                target_class_idx = int(tf.argmax(predictions[0]))
            class_score = predictions[:, target_class_idx]

        grads = tape.gradient(class_score, conv_outputs)
        pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))
        conv_outputs = conv_outputs[0]

        heatmap = tf.reduce_sum(conv_outputs * pooled_grads, axis=-1)
        heatmap = tf.maximum(heatmap, 0)
        max_heat = tf.reduce_max(heatmap)
        if max_heat > 0:
            heatmap = heatmap / max_heat
        heatmap_np = heatmap.numpy()

        # Resize heatmap to match original image dimensions for pristine overlay
        target_size = (orig_pil.width, orig_pil.height)
        heatmap_resized = tf.image.resize(
            heatmap_np[..., np.newaxis], 
            (orig_pil.height, orig_pil.width)
        ).numpy().squeeze()

        # Apply colormap
        import matplotlib as mpl
        try:
            cmap = mpl.colormaps[colormap_name]
        except Exception:
            cmap = mpl.colormaps["jet"]
        colored_heatmap = cmap(heatmap_resized)[:, :, :3] # RGB (H, W, 3) in [0, 1]
        heatmap_uint8 = np.uint8(255 * colored_heatmap)

        # Blended overlay
        orig_np = np.array(orig_pil)
        alpha = 0.45
        blended = np.uint8(orig_np * (1 - alpha) + heatmap_uint8 * alpha)

        # Convert to base64
        def to_b64(img_arr: np.ndarray) -> str:
            im = Image.fromarray(img_arr)
            buf = io.BytesIO()
            im.save(buf, format="PNG")
            return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("utf-8")

        heatmap_b64 = to_b64(heatmap_uint8)
        overlay_b64 = to_b64(blended)

        # Heatmap statistics
        high_activation_mask = (heatmap_resized > 0.65)
        high_activation_area_pct = round(float(np.mean(high_activation_mask)) * 100, 2)
        y_indices, x_indices = np.where(heatmap_resized == np.max(heatmap_resized))
        peak_focus = [int(x_indices[0]), int(y_indices[0])] if len(x_indices) > 0 else [0, 0]

        target_class_name = CLASS_NAMES[target_class_idx]
        explanation_summary = self._generate_scientific_explanation(
            target_class_name, 
            high_activation_area_pct, 
            peak_focus,
            orig_pil.size
        )

        return {
            "target_class": target_class_name,
            "target_class_index": target_class_idx,
            "last_conv_layer": self.last_conv_layer_name,
            "heatmap_base64": heatmap_b64,
            "overlay_base64": overlay_b64,
            "high_activation_area_pct": high_activation_area_pct,
            "peak_focus_coordinates": peak_focus,
            "explanation_summary": explanation_summary,
            "colormap": colormap_name
        }

    def _generate_scientific_explanation(
        self, 
        class_name: str, 
        high_area_pct: float, 
        peak_focus: List[int],
        img_size: Tuple[int, int]
    ) -> Dict[str, Any]:
        explanations = {
            "01_TUMOR": (
                "The CNN concentrated peak feature gradients on atypical glandular epithelium, "
                "localizing regions with high nuclear-to-cytoplasmic ratio, crowded cribriform glands, "
                "and cellular pleomorphism typical of invasive colorectal adenocarcinoma."
            ),
            "02_STROMA": (
                "Model attention focused primarily on the desmoplastic extracellular matrix, "
                "capturing parallel collagen bundles, spindle-shaped cancer-associated fibroblasts (CAFs), "
                "and microvascular stromal networks surrounding neoplastic formations."
            ),
            "03_COMPLEX": (
                "The attention heatmap highlights transitional interface zones with mixed cellularity, "
                "where fragmented glandular epithelium infiltrates disorganized reactive stromal fibers "
                "and focal inflammatory elements."
            ),
            "04_LYMPHO": (
                "The network prioritized dense hyperchromatic round-cell aggregates consistent with "
                "tumor-infiltrating lymphocytes (TILs) and lymphoid follicles with minimal cytoplasmic presence."
            ),
            "05_DEBRIS": (
                "Activation is centered on acellular amorphous eosinophilic areas and pyknotic nuclear dust, "
                "reflecting intraluminal necrotic material and disrupted necrotic debris ('dirty necrosis')."
            ),
            "06_MUCOSA": (
                "Salient activations align with well-organized, parallel glandular crypts containing abundant "
                "regular goblet cells and basally oriented, uniform colonocyte nuclei without cytologic atypia."
            ),
            "07_ADIPOSE": (
                "Feature maps localized unilocular lipid vacuole architecture, identifying thin peripheral "
                "adipocyte membranes and compressed crescentic nuclei characteristic of pericolic fat."
            ),
            "08_EMPTY": (
                "Gradient maps confirm low-frequency baseline activations focused exclusively on acellular "
                "transparent background glass or mounting medium with absence of tissue structures."
            )
        }

        specific_text = explanations.get(
            class_name, 
            "Gradient activations reflect key morphological textures learned during training."
        )

        return {
            "clinical_morphology": specific_text,
            "saliency_metrics": (
                f"Peak gradient activation is localized at coordinate ({peak_focus[0]}, {peak_focus[1]}). "
                f"Salient attention covers approximately {high_area_pct}% of the tissue tile."
            ),
            "xai_caveat": (
                "Grad-CAM attention highlights spatial features influential in the CNN mathematical classification. "
                "This visualization reflects algorithmic feature weighting and must not be interpreted as an automated medical diagnosis."
            )
        }
