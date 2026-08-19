import { v2 as cloudinary } from 'cloudinary';
import { config } from '../../config';
import { logger } from '../../utils/logger';


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'rideshare-demo',
  api_key: process.env.CLOUDINARY_API_KEY || '1234567890',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'secret-key-demo',
});

export class CloudinaryStorageService {
  public generateSignedUploadParams(userId: string, folder: string = 'documents'): {
    signature: string;
    timestamp: number;
    folder: string;
    publicId: string;
  } {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const publicId = `${userId}_${timestamp}`;

    const paramsToSign = {
      timestamp,
      folder: `rideshare/${folder}`,
      public_id: publicId,
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET || 'secret-key-demo'
    );

    return {
      signature,
      timestamp,
      folder: `rideshare/${folder}`,
      publicId,
    };
  }
}

export const cloudinaryService = new CloudinaryStorageService();
