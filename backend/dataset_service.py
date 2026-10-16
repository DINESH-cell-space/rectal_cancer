import io
import os
import glob
from pathlib import Path
from typing import List, Dict, Optional, Any
from PIL import Image
import tifffile
import numpy as np

# Class metadata definition
CLASS_METADATA = {
    "01_TUMOR": {
        "id": "01_TUMOR",
        "name": "Tumor Epithelium",
        "code": "CRC-TUM",
        "color": "#EF4444", # Red
        "badge": "Malignant",
        "severity": "High",
        "description": "Colorectal adenocarcinoma epithelial sheets and glandular structures showing cellular pleomorphism, hyperchromatic enlarged nuclei, and loss of cell polarity.",
        "morphology": "Crowded atypical epithelial glands, cribriform patterns, prominent nucleoli, high nuclear-to-cytoplasmic ratio.",
        "clinical_significance": "Primary malignant component of colorectal adenocarcinoma; target for tumor budding, depth of invasion (pT), and molecular biomarker assessment.",
        "differential": "Must be distinguished from high-grade dysplasia and reactive regenerative mucosa."
    },
    "02_STROMA": {
        "id": "02_STROMA",
        "name": "Tumor Stroma",
        "code": "CRC-STR",
        "color": "#F59E0B", # Amber
        "badge": "Microenvironment",
        "severity": "Moderate",
        "description": "Desmoplastic stroma composed of activated cancer-associated fibroblasts (CAFs), myofibroblasts, and extracellular collagenous matrix surrounding neoplastic glands.",
        "morphology": "Spindle-shaped stromal cells with elongated nuclei, dense eosinophilic collagen bundles, microvascular proliferation.",
        "clinical_significance": "Tumor-stroma ratio (TSR) is an independent prognostic factor in stage II/III CRC; high stromal proportion often correlates with aggressive phenotype and immune evasion.",
        "differential": "Differentiated from normal mucosal lamina propria and hypocellular keloid-like fibrosis."
    },
    "03_COMPLEX": {
        "id": "03_COMPLEX",
        "name": "Complex Stroma",
        "code": "CRC-CPX",
        "color": "#8B5CF6", # Violet
        "badge": "Mixed Subtype",
        "severity": "Moderate",
        "description": "Heterogeneous microenvironment containing fragmented glands, inflammatory infiltrates, stromal collagen, and capillaries in close proximity.",
        "morphology": "Mixed cellularity, disrupted basement membranes, intermixed isolated neoplastic cells and reactive fibroblasts.",
        "clinical_significance": "Represents the invasive front or transitional boundary between bulk tumor parenchyma and host mesenchymal tissue.",
        "differential": "Frequently confused with inflammatory pseudotumor or tangential cuts through glandular crypts."
    },
    "04_LYMPHO": {
        "id": "04_LYMPHO",
        "name": "Lymphoid Infiltrate",
        "code": "CRC-LYM",
        "color": "#3B82F6", # Blue
        "badge": "Immunological",
        "severity": "Low",
        "description": "Dense aggregates of tumor-infiltrating lymphocytes (TILs), plasma cells, and secondary lymphoid follicles within or adjacent to colorectal tumors.",
        "morphology": "Small, uniform round cells with dense hyperchromatic round nuclei and scant basophilic cytoplasm, organized in clusters.",
        "clinical_significance": "High TIL density (especially CD3+/CD8+ cytotoxic T cells) correlates strongly with microsatellite instability-high (MSI-H) status and improved recurrence-free survival.",
        "differential": "Differentiated from poorly differentiated small cell carcinomas or necrotic apoptotic debris."
    },
    "05_DEBRIS": {
        "id": "05_DEBRIS",
        "name": "Necrotic Debris",
        "code": "CRC-DEB",
        "color": "#6B7280", # Slate / Gray
        "badge": "Acellular",
        "severity": "Moderate",
        "description": "Acellular or necrotic eosinophilic material, karyorrhectic fragments, extruded luminal mucus, and disintegrated neutrophils (dirty necrosis).",
        "morphology": "Amorphous pink substance, nuclear dust (pyknotic fragments), lack of intact cell membranes, occasional extracellular mucin pools.",
        "clinical_significance": "Intraluminal 'dirty necrosis' is a hallmark histopathologic feature of colorectal adenocarcinoma (useful for confirming metastatic CRC in secondary sites).",
        "differential": "Must be distinguished from extracellular mucin pools in mucinous adenocarcinoma and acellular stroma."
    },
    "06_MUCOSA": {
        "id": "06_MUCOSA",
        "name": "Benign Colonic Mucosa",
        "code": "CRC-MUC",
        "color": "#10B981", # Emerald
        "badge": "Benign Normal",
        "severity": "Normal",
        "description": "Physiological normal colon architecture containing straight, test-tube-like crypts lined by regular goblet cells and absorptive colonocytes with basal nuclei.",
        "morphology": "Parallel crypts extending to the muscularis mucosae, abundant mucin-producing goblet cells, basally oriented uniform nuclei without atypia.",
        "clinical_significance": "Reference baseline tissue confirming non-neoplastic resection margins and absence of invasive carcinoma.",
        "differential": "Differentiated from hyperplastic polyps and low-grade tubular adenomas."
    },
    "07_ADIPOSE": {
        "id": "07_ADIPOSE",
        "name": "Adipose Tissue",
        "code": "CRC-ADI",
        "color": "#06B6D4", # Cyan
        "badge": "Mesenchymal",
        "severity": "Normal",
        "description": "Mature subserosal or submucosal unilocular white adipose tissue composed of lipid-filled adipocytes with eccentrically flattened nuclei.",
        "morphology": "Large optically clear cells with delicate plasma membranes, compressed peripheral crescentic nuclei, delicate capillary network.",
        "clinical_significance": "Presence of tumor cells within subserosal adipose tissue indicates T3 disease (invasion beyond the muscularis propria into the pericolic fat).",
        "differential": "Distinguished from artifactual optical vacuolization or extensive mucin pools."
    },
    "08_EMPTY": {
        "id": "08_EMPTY",
        "name": "Empty Background",
        "code": "CRC-EMP",
        "color": "#64748B", # Muted slate
        "badge": "Background",
        "severity": "None",
        "description": "Acellular slide background consisting of glass, mounting medium, or lumen containing no biologic specimen or diagnostic cellularity.",
        "morphology": "Optically clear, uniform white or light illumination with minimal background illumination artifacts.",
        "clinical_significance": "Important for automated digital pathology whole-slide image (WSI) background segmentation and tissue tile filtering.",
        "differential": "Distinguished from unilocular adipocytes and completely clear mucin pools by lack of cell borders."
    }
}

class DatasetService:
    def __init__(self, workspace_dir: Path):
        self.workspace_dir = workspace_dir
        self.dataset_dir = self._find_dataset_dir()
        self.image_index: List[Dict[str, Any]] = []
        self._build_index()

    def _find_dataset_dir(self) -> Path:
        # 1. Local dataset in workspace
        local_dir = self.workspace_dir / "dataset"
        if local_dir.exists() and any(p.is_dir() for p in local_dir.iterdir()):
            return local_dir

        # 2. Check Downloads extracted path
        downloads_kather = Path(r"C:\Users\admin\Downloads\Kather_texture_2016_image_tiles_5000\Kather_texture_2016_image_tiles_5000")
        if downloads_kather.exists():
            return downloads_kather

        # Fallback to local_dir
        local_dir.mkdir(parents=True, exist_ok=True)
        return local_dir

    def set_dataset_path(self, new_path: str) -> bool:
        p = Path(new_path)
        if p.exists() and p.is_dir():
            self.dataset_dir = p
            self._build_index()
            return True
        return False

    def _build_index(self):
        self.image_index = []
        if not self.dataset_dir.exists():
            return

        image_extensions = {".tif", ".tiff", ".png", ".jpg", ".jpeg"}
        class_folders = sorted([p for p in self.dataset_dir.iterdir() if p.is_dir()])

        img_id_counter = 1
        for folder in class_folders:
            class_name = folder.name
            for file_path in sorted(folder.iterdir()):
                if file_path.suffix.lower() in image_extensions:
                    self.image_index.append({
                        "id": f"img_{img_id_counter:05d}",
                        "filename": file_path.name,
                        "path": str(file_path),
                        "ground_truth": class_name,
                        "class_id": class_name,
                        "class_meta": CLASS_METADATA.get(class_name, {
                            "name": class_name,
                            "badge": "Tissue",
                            "color": "#38BDF8"
                        }),
                        "file_size": file_path.stat().st_size if file_path.exists() else 0
                    })
                    img_id_counter += 1

    def get_summary(self) -> Dict[str, Any]:
        total_images = len(self.image_index)
        class_counts = {}
        for item in self.image_index:
            c = item["ground_truth"]
            class_counts[c] = class_counts.get(c, 0) + 1

        classes_list = []
        for c_id, meta in CLASS_METADATA.items():
            classes_list.append({
                **meta,
                "count": class_counts.get(c_id, 0)
            })

        return {
            "dataset_name": "Zenodo 53169 — Kather Colorectal Histology (CRC-5000)",
            "dataset_path": str(self.dataset_dir),
            "total_images": total_images,
            "classes_count": len(CLASS_METADATA),
            "class_distribution": class_counts,
            "classes": classes_list,
            "is_available": total_images > 0
        }

    def get_images(self, page: int = 1, page_size: int = 24, class_filter: Optional[str] = None, search: Optional[str] = None) -> Dict[str, Any]:
        filtered = self.image_index

        if class_filter and class_filter.strip() and class_filter != "ALL":
            filtered = [item for item in filtered if item["ground_truth"] == class_filter]

        if search and search.strip():
            s = search.strip().lower()
            filtered = [
                item for item in filtered 
                if s in item["filename"].lower() or s in item["ground_truth"].lower()
            ]

        total = len(filtered)
        start = (page - 1) * page_size
        end = start + page_size
        items = filtered[start:end]

        return {
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size if page_size > 0 else 1,
            "items": items
        }

    def get_image_by_id(self, image_id: str) -> Optional[Dict[str, Any]]:
        for item in self.image_index:
            if item["id"] == image_id:
                return item
        return None

    def read_image_bytes(self, image_path: str, format: str = "PNG") -> bytes:
        p = Path(image_path)
        if not p.exists():
            raise FileNotFoundError(f"Image not found: {image_path}")

        try:
            if p.suffix.lower() in {".tif", ".tiff"}:
                img_array = tifffile.imread(str(p))
                if img_array.ndim == 2:
                    img_array = np.stack([img_array] * 3, axis=-1)
                elif img_array.ndim == 3 and img_array.shape[0] in (1, 3, 4) and img_array.shape[-1] not in (1, 3, 4):
                    img_array = np.transpose(img_array, (1, 2, 0))
                if img_array.shape[-1] > 3:
                    img_array = img_array[:, :, :3]
                if img_array.dtype != np.uint8:
                    img_array = np.clip(img_array, 0, 255).astype(np.uint8)
                pil_img = Image.fromarray(img_array)
            else:
                with Image.open(str(p)) as im:
                    pil_img = im.convert("RGB")
        except Exception:
            with Image.open(str(p)) as im:
                pil_img = im.convert("RGB")

        buffer = io.BytesIO()
        pil_img.save(buffer, format=format)
        return buffer.getvalue()

    def get_similar_images(self, image_id: str, limit: int = 6) -> List[Dict[str, Any]]:
        current = self.get_image_by_id(image_id)
        if not current:
            return []

        gt = current["ground_truth"]
        same_class = [img for img in self.image_index if img["ground_truth"] == gt and img["id"] != image_id]
        import random
        r = random.Random(hash(image_id))
        sampled = r.sample(same_class, min(limit, len(same_class)))
        return sampled

    def get_class_showcase(self) -> List[Dict[str, Any]]:
        showcase = []
        for c_id, meta in CLASS_METADATA.items():
            matches = [img for img in self.image_index if img["ground_truth"] == c_id]
            sample_ids = [m["id"] for m in matches[:4]]
            showcase.append({
                **meta,
                "sample_image_ids": sample_ids,
                "total_in_dataset": len(matches)
            })
        return showcase
