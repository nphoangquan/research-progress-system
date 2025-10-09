export interface CloudinaryResponse {
  public_id: string;
  secure_url: string;
  url: string;
  format: string;
  resource_type: string;
  bytes: number;
  width?: number;
  height?: number;
  created_at: string;
}

export interface UploadOptions {
  folder?: string;
  use_filename?: boolean;
  unique_filename?: boolean;
  overwrite?: boolean;
  transformation?: any[];
}