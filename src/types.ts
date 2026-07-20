export interface UserProfile {
  uid: string;
  email: string;
  createdAt: string;
}

export interface ClientFile {
  id: string;
  name: string;
  size: number;
  type: string;
  ownerId: string;
  uploadedAt: string;
  downloadUrl?: string;
  isUploading?: boolean;
}
