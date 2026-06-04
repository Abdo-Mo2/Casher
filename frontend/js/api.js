window.FastPOS = window.FastPOS || {}
const FP = window.FastPOS

FP.imageUrl = function (src) {
  if (!src) return ''
  if (src.startsWith('data:') || src.startsWith('http')) return src
  return src
}

FP.saveProductForm = async function (formData, id) {
  const data = {
    name: formData.get('name')?.trim(),
    price: parseFloat(formData.get('price')),
    category: formData.get('category') || 'عام'
  }
  const file = formData.get('image')
  if (file && file.size > 0) data.image = await FP.fileToDataUrl(file)
  return FP.saveProduct(data, id || null)
}
