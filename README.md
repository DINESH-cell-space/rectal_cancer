# BioLens AI — Colorectal Tissue Intelligence Platform
**Futuristic 2030 Explainable AI (XAI) Histopathology Workstation**

BioLens AI is a clinical-grade medical AI research workstation designed for automated colorectal tissue histopathology classification and visual explainability. Built on the **Zenodo 53169 (Kather et al.)** colorectal tissue benchmark and powered by a deep convolutional neural network (CNN) integrated with **Grad-CAM (Gradient-Weighted Class Activation Mapping)**, BioLens AI provides deep cellular intelligence and transparent AI decision support.

---

## 1. Existing Model Inspection & Technical Audit (`rectal cancer.py`)

As mandated, a complete inspection of `rectal cancer.py` was conducted prior to development:

| Audit Item | Inspection Finding & Verified Specification |
| :--- | :--- |
| **1. Model Training vs. Loading** | The original script defines and **trains** a custom 4-block Conv2D architecture for 30 epochs, monitors `val_loss`, and loads the best saved checkpoint via `tf.keras.models.load_model(OUTPUT_DIR / "best_rectal_cancer_model.keras")`. |
| **2. Saved Model Formats** | Checkpoint saves to `rectal_cancer_outputs/best_rectal_cancer_model.keras` during training, and `rectal_cancer_outputs/final_rectal_cancer_model.keras` upon completion. |
| **3. Model Architecture & Weights** | The file defines the complete architecture (`Colorectal_Histology_CNN`), data augmentation pipeline, and layers, but the raw Python script does not embed pre-saved weights—they are generated upon execution. |
| **4. Dataset & Storage** | **Zenodo 53169** (*Kather et al.*, 5,000 colorectal histology tiles across 8 classes). Located on this machine at `C:\Users\admin\Downloads\Kather_texture_2016_image_tiles_5000\Kather_texture_2016_image_tiles_5000` (and curated locally in `./dataset/`). |
| **5. Image Dimensions & Pipeline** | **(150, 150, 3)**. Preprocessing pipeline: `read_tiff` handles 1/3-channel conversions, uint8 clipping, bilinear resize to `(150, 150)`, and normalized float32 division by `255.0`. |
| **6. Number of Classes & Order** | **8 output classes** in alphabetical order:<br>`01_TUMOR`, `02_STROMA`, `03_COMPLEX`, `04_LYMPHO`, `05_DEBRIS`, `06_MUCOSA`, `07_ADIPOSE`, `08_EMPTY`. |
| **7. Prediction Functions** | `model.predict(...)` was implemented as inline script logic without standalone REST API endpoints. |
| **8. Grad-CAM Implementation** | Implemented using `tf.GradientTape()` targeting the last `Conv2D` layer (`conv2d_3`), computing global average pooled gradients and ReLU activation maps. |
| **9. Empirical Evaluation Metrics** | Recovered directly from the Colab notebook training run:<br>&bull; **Test Accuracy:** `0.9173` (91.73%)<br>&bull; **Macro Precision:** `0.9216`<br>&bull; **Macro Recall:** `0.9173`<br>&bull; **Macro F1-Score:** `0.9174`<br>&bull; All 5 evaluation plots preserved in `rectal_cancer_outputs/`. |
| **10. Dependencies** | Python 3.12 (TensorFlow 2.x, Keras 3.x, FastAPI, Uvicorn, Pillow, Tifffile, NumPy, Pandas, Scikit-learn, Matplotlib, ReportLab), Node.js v20.x, React, Vite, Tailwind CSS. |

---

## 2. System Architecture

```
d:\my personal project\
├── rectal cancer.py                     # Original deep learning training script (Preserved)
├── train_model.py                       # Local training utility script
├── rectal_cancer_outputs/               # Model weights, metrics, and empirical verification plots
│   ├── best_rectal_cancer_model.keras   # Active trained Keras model
│   ├── final_rectal_cancer_model.keras  # Final epoch model
│   ├── class_distribution.png           # Dataset distribution plot
│   ├── training_accuracy_loss.png       # Loss & accuracy curves
│   ├── confusion_matrix.png             # Test confusion matrix
│   ├── sample_predictions.png           # 12-sample prediction grid
│   ├── gradcam.png                      # Verified Grad-CAM heatmap
│   ├── test_metrics.csv                 # Quantitative test scores
│   └── classification_report.txt        # Full per-class report
├── dataset/                             # Local curated Kather 2016 histological tiles
│   ├── 01_TUMOR/                        # Colorectal adenocarcinoma epithelium
│   ├── 02_STROMA/                       # Desmoplastic tumor stroma
│   ├── 03_COMPLEX/                      # Complex stroma / interface
│   ├── 04_LYMPHO/                       # Immune cell infiltrate / TILs
│   ├── 05_DEBRIS/                       # Necrosis and mucus
│   ├── 06_MUCOSA/                       # Normal colonic mucosa
│   ├── 07_ADIPOSE/                      # Fat tissue
│   └── 08_EMPTY/                        # Background / glass
├── backend/                             # Python FastAPI REST Service
│   ├── main.py                          # API router & endpoints
│   ├── model_service.py                 # Keras model inference & Grad-CAM engine
│   ├── dataset_service.py               # Dataset indexing & tile conversion
│   ├── report_service.py                # ReportLab PDF generator
│   └── requirements.txt
├── frontend/                            # React + Vite + TypeScript + Tailwind
│   ├── src/
│   │   ├── pages/                       # Dashboard, Explorer, Analysis, Explain, Learn, Reports, ModelInfo, Settings
│   │   ├── components/                  # Navbar, Sidebar, ImageViewer, ProbabilityBar
│   │   ├── services/api.ts              # API client
│   │   └── types/index.ts               # TypeScript data models
│   ├── package.json
│   └── tailwind.config.js
└── README.md
```

---

## 3. Workstation Modules

1. **Dashboard:** Panoramic medical AI command center with key performance indicators (KPIs), active model health status, dataset tile counts, and interactive Recharts class distribution chart.
2. **Dataset Explorer:** Paginated gallery with real-time class filtering (`01_TUMOR` through `08_EMPTY`), filename search, and quick links to open any tile in the analysis workspace.
3. **Image Analysis Workspace:** High-resolution micrograph viewer with pan, zoom, reset, fullscreen, real deep learning CNN inference, ground-truth verification comparison, and full 8-class softmax probability distribution.
4. **Explain the Prediction (Grad-CAM):** Dedicated XAI laboratory generating real heatmaps from the last convolutional layer (`conv2d_3`), featuring adjustable overlay blend sliders, custom colormaps (Jet, Turbo, Plasma, Magma, Viridis), quantitative spatial metrics (peak focus coordinate, high-activation area %), and scientifically responsible explanations.
5. **Tissue Class Learning:** Comprehensive digital pathology educational atlas detailing morphology, clinical significance, differential diagnosis, and representative biopsy tiles for all 8 tissue classes.
6. **Image Report Generator:** On-demand compilation of publication-quality PDF reports featuring BioLens AI branding, scan metadata, side-by-side micrographs, probability breakdown tables, and research disclaimers.
7. **Model Information:** Full neural architecture inspection, sequential layer hierarchy, training hyperparameters, classification report, and empirical training artifacts.
8. **Settings:** Dynamic dataset path configuration, `.keras` / `.h5` model weights upload, and live backend connection diagnostics.

---

## 4. How to Run the Application

### Option A: Running with Active Background Servers (Already Running)
The application servers are currently active:
- **Backend API:** [http://127.0.0.1:8000](http://127.0.0.1:8000) (Interactive Swagger Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs))
- **Frontend Dashboard:** [http://127.0.0.1:5173](http://127.0.0.1:5173)

### Option B: Starting Manually

#### Step 1: Start the FastAPI Backend
Open a terminal in `d:\my personal project\backend`:
```powershell
py -3.12 -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

#### Step 2: Start the React Frontend
Open a second terminal in `d:\my personal project\frontend`:
```powershell
npm run dev -- --host 127.0.0.1 --port 5173
```
Then navigate to **`http://127.0.0.1:5173/`** in any modern web browser.

---

## 5. Medical & Research Disclaimer

> [!WARNING]
> **FOR RESEARCH & EDUCATIONAL USE ONLY:** BioLens AI is an artificial intelligence research platform. All model predictions, Grad-CAM attention visualizations, and automated metrics are experimental decision-support features and do **NOT** constitute clinical diagnostic evaluations or medical advice. Histopathological diagnoses must be confirmed by board-certified pathologists evaluating comprehensive whole slide imaging (WSI) and patient clinical records.
