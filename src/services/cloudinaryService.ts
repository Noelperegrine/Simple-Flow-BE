import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

export interface CloudinaryUploadOptions {
  folder?: string;
  public_id?: string;
  overwrite?: boolean;
  resource_type?: 'image' | 'video' | 'raw' | 'auto';
  transformation?: any;
}

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  url: string;
  bytes: number;
  format: string;
  resource_type: string;
  created_at: string;
  width?: number;
  height?: number;
}

class CloudinaryService {
  /**
   * Upload file to Cloudinary
   * @param fileBuffer - File buffer data
   * @param options - Upload options
   * @returns Upload result with URLs and metadata
   */
  async uploadFile(fileBuffer: Buffer, options: CloudinaryUploadOptions = {}): Promise<CloudinaryUploadResult> {
    try {
      const result = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            folder: options.folder || 'practice-flow',
            public_id: options.public_id,
            overwrite: options.overwrite || false,
            resource_type: options.resource_type || 'auto',
            transformation: options.transformation
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        ).end(fileBuffer);
      });

      return {
        public_id: result.public_id,
        secure_url: result.secure_url,
        url: result.url,
        bytes: result.bytes,
        format: result.format,
        resource_type: result.resource_type,
        created_at: result.created_at,
        width: result.width,
        height: result.height
      };
    } catch (error: any) {
      throw new Error(`Cloudinary upload failed: ${error.message}`);
    }
  }

  /**
   * Delete file from Cloudinary
   * @param publicId - The public ID of the file to delete
   * @param resourceType - Type of resource (image, video, raw)
   */
  async deleteFile(publicId: string, resourceType: 'image' | 'video' | 'raw' = 'image'): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    } catch (error: any) {
      throw new Error(`Cloudinary delete failed: ${error.message}`);
    }
  }

  /**
   * Get optimized URL for an image with transformations
   * @param publicId - The public ID of the image
   * @param transformations - Cloudinary transformation options
   */
  getOptimizedUrl(publicId: string, transformations: any = {}): string {
    return cloudinary.url(publicId, {
      secure: true,
      ...transformations
    });
  }

  /**
   * Test Cloudinary connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await cloudinary.api.ping();
      return true;
    } catch (error) {
      console.error('Cloudinary connection failed:', error);
      return false;
    }
  }
}

export default CloudinaryService;