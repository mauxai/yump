export interface UserPublic {
  id:           string;
  name:         string | null;
  email:        string;
  avatar:    string | null;
  status:       "active" | "suspended";
  creditsUsed:  number;
  creditsTotal: number;
  createdAt:    string;
}

export interface UpdateProfileData {
  name?:            string;
  avatar?:       string | null;
  password?:        string;
  currentPassword?: string;
}
