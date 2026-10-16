import { 
  DatasetSummary, 
  DatasetListResponse, 
  DatasetImage, 
  PredictionResult, 
  GradcamResult, 
  ModelInfo,
  TissueClassMeta
} from '../types';

const API_BASE = '/api';

export const api = {
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  async getDatasetSummary(): Promise<DatasetSummary> {
    const res = await fetch(`${API_BASE}/dataset/summary`);
    if (!res.ok) throw new Error("Failed to fetch dataset summary");
    return res.json();
  },

  async getDatasetClasses(): Promise<TissueClassMeta[]> {
    const res = await fetch(`${API_BASE}/dataset/classes`);
    if (!res.ok) throw new Error("Failed to fetch dataset classes");
    return res.json();
  },

  async getClassShowcase(): Promise<TissueClassMeta[]> {
    const res = await fetch(`${API_BASE}/dataset/showcase`);
    if (!res.ok) throw new Error("Failed to fetch class showcase");
    return res.json();
  },

  async getImages(
    page: number = 1, 
    pageSize: number = 24, 
    classFilter?: string, 
    search?: string
  ): Promise<DatasetListResponse> {
    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("page_size", pageSize.toString());
    if (classFilter && classFilter !== "ALL") params.set("class_filter", classFilter);
    if (search) params.set("search", search);

    const res = await fetch(`${API_BASE}/images?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch images");
    return res.json();
  },

  async getImageDetails(imageId: string): Promise<DatasetImage> {
    const res = await fetch(`${API_BASE}/images/${imageId}`);
    if (!res.ok) throw new Error("Failed to fetch image details");
    return res.json();
  },

  getImageRawUrl(imageId: string): string {
    return `${API_BASE}/images/${imageId}/raw`;
  },

  async getSimilarImages(imageId: string, limit: number = 6): Promise<DatasetImage[]> {
    const res = await fetch(`${API_BASE}/images/${imageId}/similar?limit=${limit}`);
    if (!res.ok) throw new Error("Failed to fetch similar images");
    return res.json();
  },

  async predict(imageId?: string, file?: File): Promise<PredictionResult> {
    const formData = new FormData();
    if (imageId) formData.append("image_id", imageId);
    if (file) formData.append("file", file);

    const res = await fetch(`${API_BASE}/predict`, {
      method: "POST",
      body: formData
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Inference failed" }));
      throw new Error(err.detail || "Inference error");
    }
    return res.json();
  },

  async explainGradcam(
    imageId?: string, 
    targetClassIndex?: number, 
    colormap: string = "jet",
    file?: File
  ): Promise<GradcamResult> {
    const formData = new FormData();
    if (imageId) formData.append("image_id", imageId);
    if (targetClassIndex !== undefined && targetClassIndex !== null) {
      formData.append("target_class_index", targetClassIndex.toString());
    }
    formData.append("colormap", colormap);
    if (file) formData.append("file", file);

    const res = await fetch(`${API_BASE}/explain/gradcam`, {
      method: "POST",
      body: formData
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Grad-CAM computation failed" }));
      throw new Error(err.detail || "Grad-CAM computation failed");
    }
    return res.json();
  },

  async getModelInfo(): Promise<ModelInfo> {
    const res = await fetch(`${API_BASE}/model/info`);
    if (!res.ok) throw new Error("Failed to fetch model info");
    return res.json();
  },

  getModelPlotUrl(plotName: string): string {
    return `${API_BASE}/model/outputs/${plotName}`;
  },

  async reloadModel(customPath?: string) {
    const formData = new FormData();
    if (customPath) formData.append("path", customPath);
    const res = await fetch(`${API_BASE}/model/reload`, {
      method: "POST",
      body: formData
    });
    return res.json();
  },

  async uploadModel(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/model/upload`, {
      method: "POST",
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Upload failed" }));
      throw new Error(err.detail || "Upload failed");
    }
    return res.json();
  },

  async downloadReport(reportData: any): Promise<Blob> {
    const res = await fetch(`${API_BASE}/reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reportData)
    });
    if (!res.ok) throw new Error("Failed to generate PDF report");
    return res.blob();
  },

  async setDatasetPath(path: string): Promise<DatasetSummary> {
    const res = await fetch(`${API_BASE}/settings/dataset-path`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Failed to set path" }));
      throw new Error(err.detail || "Failed to set dataset path");
    }
    return res.json();
  }
};
