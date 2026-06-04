# FastPOS — Fast Food Restaurant POS

نظام كاشير يعمل **بدون MongoDB** و**بدون إنترنت** — كل البيانات تُحفظ على الجهاز (IndexedDB).

## التشغيل

### الطريقة 1 — فتح الملف مباشرة
افتح `frontend/index.html` في Chrome أو Edge.

### الطريقة 2 — خادم محلي (للتثبيت كتطبيق + وضع offline كامل)
```bash
cd frontend
npx serve .
```
ثم افتح الرابط المعروض (مثال: http://localhost:3000).

## المميزات

- لا يحتاج Node.js ولا MongoDB على الجهاز
- يعمل بدون إنترنت بعد التحميل الأول
- المنتجات، الطلبات، والإحصائيات محفوظة محلياً
- صور المنتجات تُخزَّن على الجهاز
- اسم الكاشير إلزامي على الفاتورة

## الصفحات

| الصفحة | الملف |
|--------|--------|
| الكاشير | `index.html` |
| المنتجات | `products.html` |
| الإحصائيات | `dashboard.html` |

## مجلد backend (اختياري)

مجلد `backend/` للتشغيل القديم مع MongoDB — **غير مطلوب** للاستخدام العادي.

## GitHub

[github.com/Abdo-Mo2/Casher](https://github.com/Abdo-Mo2/Casher)
