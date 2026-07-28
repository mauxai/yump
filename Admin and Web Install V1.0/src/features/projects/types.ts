export interface ProjectSummary {
  id:        string;
  name:      string;
  editCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDetail extends ProjectSummary {
  originalImage: string;
  edits:         EditRecord[];
}

export interface EditRecord {
  id:        string;
  prompt:    string;
  image:     string;
  parentId:  string | null;
  createdAt: string;
}

export interface CreateProjectInput {
  name:          string;
  originalImage: string;
}
