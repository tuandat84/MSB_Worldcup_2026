/** Giới hạn file gốc trước khi resize (5MB) */
export const MAX_AVATAR_FILE_SIZE = 5 * 1024 * 1024

/** Cạnh dài nhất sau resize (px) */
export const MAX_AVATAR_DIMENSION = 512

/** Chất lượng JPEG sau resize */
export const AVATAR_JPEG_QUALITY = 0.85

/** Giới hạn buffer ảnh đã resize trên server (3MB) */
export const MAX_AVATAR_UPLOAD_BYTES = 3 * 1024 * 1024

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"])

export function isAllowedImageType(file: File): boolean {
  return ALLOWED_TYPES.has(file.type)
}

/**
 * Resize ảnh avatar về tối đa 512px, xuất JPEG để giảm dung lượng upload.
 * Chỉ dùng trên trình duyệt (client component).
 */
export function resizeAvatarImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      URL.revokeObjectURL(url)

      let width = img.naturalWidth
      let height = img.naturalHeight
      const maxDim = MAX_AVATAR_DIMENSION

      if (width > maxDim || height > maxDim) {
        if (width >= height) {
          height = Math.round((height * maxDim) / width)
          width = maxDim
        } else {
          width = Math.round((width * maxDim) / height)
          height = maxDim
        }
      }

      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("Không thể xử lý ảnh"))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL("image/jpeg", AVATAR_JPEG_QUALITY))
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Không thể đọc file ảnh"))
    }

    img.src = url
  })
}
