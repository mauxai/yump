export interface ImageRecord {
  id:          string;
  prompt:      string;
  mimeType:    string;
  projectId:   string;
  projectName: string;
  createdAt:   string;
}

export interface UploadImageInput {
  name:     string;
  dataUrl:  string;
  mimeType: string;
}

export interface UploadImageResult {
  projectId: string;
  name:      string;
  createdAt: string;
}
