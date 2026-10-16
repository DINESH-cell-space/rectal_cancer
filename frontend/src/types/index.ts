export interface TissueClassMeta {
  id: string;
  name: string;
  code: string;
  color: string;
  badge: string;
  severity: string;
  description: string;
  morphology: string;
  clinical_significance: string;
  differential: string;
  count?: number;
  sample_image_ids?: string[];
  total_in_dataset?: number;
}

export interface DatasetSummary {
  dataset_name: string;
  dataset_path: string;
  total_images: number;
  classes_count: number;
  class_distribution: Record<string, number>;
  classes: TissueClassMeta[];
  is_available: boolean;
}

export interface DatasetImage {
  id: string;
  filename: string;
  path: string;
  ground_truth: string;
  class_id: string;
  class_meta: {
    name: string;
    badge: string;
    color: string;
  };
  file_size: number;
}

export interface DatasetListResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  items: DatasetImage[];
}

export interface ClassProbability {
  class_id: string;
  class_name: string;
  probability: number;
  percentage: number;
}

export interface PredictionResult {
  predicted_class: string;
  predicted_index: number;
  confidence: number;
  confidence_percentage: number;
  probabilities: ClassProbability[];
  probabilities_sorted: ClassProbability[];
  ground_truth?: string;
  is_correct?: boolean | null;
  input_dimensions: [number, number];
  filename?: string;
  image_id?: string;
  model_name: string;
  device: string;
}

export interface GradcamResult {
  target_class: string;
  target_class_index: number;
  last_conv_layer: string;
  heatmap_base64: string;
  overlay_base64: string;
  high_activation_area_pct: number;
  peak_focus_coordinates: [number, number];
  explanation_summary: {
    clinical_morphology: string;
    saliency_metrics: string;
    xai_caveat: string;
  };
  colormap: string;
}

export interface ModelInfo {
  model_name: string;
  framework: string;
  status: string;
  error?: string | null;
  is_loaded: boolean;
  model_path?: string | null;
  input_shape: number[];
  num_classes: number;
  classes: string[];
  last_conv_layer?: string | null;
  parameters_count: number;
  layers: { name: string; class: string; output_shape: string }[];
  test_metrics: {
    test_accuracy?: number;
    macro_precision?: number;
    macro_recall?: number;
    macro_f1?: number;
  };
  classification_report?: string;
  plots: string[];
  limitations: string[];
}
