import AWS from 'aws-sdk'

// Configure AWS SDK
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
})

export class StorageService {
  private bucketName: string

  constructor() {
    this.bucketName = process.env.S3_BUCKET_NAME!
  }

  async uploadFile(file: File, key: string): Promise<string> {
    const buffer = Buffer.from(await file.arrayBuffer())

    const params = {
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    }

    const result = await s3.upload(params).promise()
    return result.Location
  }

  async uploadBuffer(buffer: Buffer, key: string, contentType: string): Promise<string> {
    const params = {
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }

    const result = await s3.upload(params).promise()
    return result.Location
  }

  async downloadFile(key: string): Promise<Buffer> {
    const params = {
      Bucket: this.bucketName,
      Key: key,
    }

    const result = await s3.getObject(params).promise()
    return result.Body as Buffer
  }

  async deleteFile(key: string): Promise<void> {
    const params = {
      Bucket: this.bucketName,
      Key: key,
    }

    await s3.deleteObject(params).promise()
  }

  async getFileUrl(key: string): Promise<string> {
    const params = {
      Bucket: this.bucketName,
      Key: key,
      Expires: 3600, // URL expires in 1 hour
    }

    return s3.getSignedUrl('getObject', params)
  }

  generateKey(userId: string, projectId: string, filename: string): string {
    const timestamp = Date.now()
    const extension = filename.split('.').pop()
    return `uploads/${userId}/${projectId}/${timestamp}.${extension}`
  }

  generateVideoKey(userId: string, projectId: string, filename: string): string {
    return `videos/${userId}/${projectId}/${filename}`
  }
}

export const storageService = new StorageService()