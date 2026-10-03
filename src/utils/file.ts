/**
 * Formats byte size into human readable string (e.g. "1.2 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = bytes / Math.pow(1024, index);
  return `${size.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

/**
 * Triggers browser download for a Blob.
 */
export function triggerFileDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Generates edited filename from original filename.
 */
export function getEditedFilename(originalFilename: string): string {
  const dotIndex = originalFilename.lastIndexOf('.');
  if (dotIndex === -1) {
    return `${originalFilename}-edited.pdf`;
  }
  const baseName = originalFilename.substring(0, dotIndex);
  return `${baseName}-edited.pdf`;
}
