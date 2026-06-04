;(function () {
  const FP = window.FastPOS

  const formEl = document.getElementById('product-form')
  const form = document.getElementById('form')
  const editId = document.getElementById('edit-id')
  const nameInput = document.getElementById('name')
  const priceInput = document.getElementById('price')
  const categorySelect = document.getElementById('category')
  const imageInput = document.getElementById('image')
  const imagePreview = document.getElementById('image-preview')
  const keywordChips = document.getElementById('keyword-chips')
  const tbody = document.getElementById('products-tbody')

  let products = []
  let currentImage = ''
  let categories = [...FP.CATEGORIES]

  function fillCategorySelect(selected = 'عام') {
    categorySelect.innerHTML = categories
      .map((c) => `<option value="${c}"${c === selected ? ' selected' : ''}>${c}</option>`)
      .join('')
  }

  function renderKeywordChips() {
    keywordChips.innerHTML = categories
      .map((c) => `<button type="button" class="keyword-chip" data-cat="${c}">${c}</button>`)
      .join('')
    keywordChips.querySelectorAll('.keyword-chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        categorySelect.value = btn.dataset.cat
      })
    })
  }

  function showImagePreview(src) {
    if (src) {
      imagePreview.innerHTML = `<img src="${src}" alt="معاينة">`
    } else {
      imagePreview.innerHTML = '<span class="preview-placeholder">🍽️ لا توجد صورة</span>'
    }
  }

  function showForm(product = null) {
    formEl.classList.add('open')
    imageInput.value = ''
    if (product) {
      editId.value = product._id
      nameInput.value = product.name
      priceInput.value = product.price
      fillCategorySelect(product.category || 'عام')
      currentImage = product.image || ''
      showImagePreview(FP.imageUrl(currentImage))
    } else {
      editId.value = ''
      form.reset()
      fillCategorySelect()
      currentImage = ''
      showImagePreview('')
    }
  }

  function hideForm() {
    formEl.classList.remove('open')
    form.reset()
    editId.value = ''
    currentImage = ''
    imagePreview.innerHTML = ''
  }

  function productThumb(p) {
    if (p.image) {
      return `<img class="table-thumb" src="${FP.imageUrl(p.image)}" alt="${p.name}">`
    }
    return '<span class="table-thumb-placeholder">🍔</span>'
  }

  function renderTable() {
    tbody.innerHTML = products
      .map(
        (p) => `
    <tr>
      <td>${productThumb(p)}</td>
      <td>${p.name}</td>
      <td><span class="category-badge">${p.category || 'عام'}</span></td>
      <td>${p.price} جنيه</td>
      <td>
        <div class="table-actions">
          <button class="btn btn-sm" data-edit="${p._id}">تعديل</button>
          <button class="btn btn-sm btn-secondary" data-delete="${p._id}">حذف</button>
        </div>
      </td>
    </tr>`
      )
      .join('')

    tbody.querySelectorAll('[data-edit]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const p = products.find((x) => x._id === btn.dataset.edit)
        if (p) showForm(p)
      })
    })

    tbody.querySelectorAll('[data-delete]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const ok = await FP.confirmDelete('هل تريد حذف هذا المنتج؟')
        if (!ok) return
        try {
          await FP.deleteProduct(btn.dataset.delete)
          FP.toastSuccess('تم حذف المنتج')
          await loadProducts()
        } catch (err) {
          FP.toastError(err.message)
        }
      })
    })
  }

  async function loadProducts() {
    products = await FP.getProducts()
    renderTable()
  }

  imageInput.addEventListener('change', () => {
    const file = imageInput.files[0]
    if (file) showImagePreview(URL.createObjectURL(file))
    else showImagePreview(FP.imageUrl(currentImage))
  })

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const payload = {
      name: nameInput.value.trim(),
      price: parseFloat(priceInput.value),
      category: categorySelect.value
    }
    const id = editId.value
    const imageFile = imageInput.files[0]

    try {
      if (imageFile) {
        const formData = new FormData()
        formData.append('name', payload.name)
        formData.append('price', String(payload.price))
        formData.append('category', payload.category)
        formData.append('image', imageFile)
        await FP.saveProductForm(formData, id || null)
      } else {
        await FP.saveProduct(payload, id || null)
      }
      FP.toastSuccess(id ? 'تم تحديث المنتج' : 'تم إضافة المنتج')
      hideForm()
      await loadProducts()
    } catch (err) {
      FP.toastError(err.message)
    }
  })

  document.getElementById('add-btn').addEventListener('click', () => showForm())
  document.getElementById('cancel-btn').addEventListener('click', hideForm)

  fillCategorySelect()
  renderKeywordChips()
  loadProducts().catch(() => {
    tbody.innerHTML = '<tr><td colspan="5">تعذر تحميل المنتجات</td></tr>'
  })
})()
