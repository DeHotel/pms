// Redimensiona y comprime una imagen en el navegador antes de enviarla al backend.
// Las fotos de huéspedes y usuarios viajan como data URL (base64) dentro del JSON,
// así que conviene mantenerlas chicas: se recortan/escalan a un cuadrado de
// `maxSize` px y se re-codifican como JPEG con la calidad indicada.
export function resizeImageFile(file, { maxSize = 160, quality = 0.8 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("No se indicó ningún archivo"))
      return
    }

    if (!file.type.startsWith("image/")) {
      reject(new Error("El archivo debe ser una imagen"))
      return
    }

    const reader = new FileReader()

    reader.onerror = () => reject(new Error("No se pudo leer el archivo"))

    reader.onload = () => {
      const img = new Image()

      img.onerror = () => reject(new Error("No se pudo cargar la imagen"))

      img.onload = () => {
        // Recorte central cuadrado, luego escala a maxSize x maxSize.
        const side = Math.min(img.width, img.height)
        const sx = (img.width - side) / 2
        const sy = (img.height - side) / 2

        const canvas = document.createElement("canvas")
        canvas.width = maxSize
        canvas.height = maxSize
        const ctx = canvas.getContext("2d")
        ctx.drawImage(img, sx, sy, side, side, 0, 0, maxSize, maxSize)

        resolve(canvas.toDataURL("image/jpeg", quality))
      }

      img.src = reader.result
    }

    reader.readAsDataURL(file)
  })
}
