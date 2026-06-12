// server/src/storage/interfaces/storage-provider.interface.ts

export interface StorageProvider {
  /**
   * Generates an upload URL (e.g. presigned PUT URL) and an access URL.
   * @param key Safe unique identifier for the file (UUID)
   * @param contentType MIME type of the file (e.g. image/jpeg)
   */
  generateUploadUrl(
    key: string,
    contentType: string,
  ): Promise<{ uploadUrl: string; fileUrl: string }>;

  /**
   * Generates a retrieval URL for accessing the private file.
   * @param key Unique identifier of the file
   */
  getFileUrl(key: string): Promise<string>;
}
