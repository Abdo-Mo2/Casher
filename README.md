# FastPOS — Fast Food Restaurant POS & Accounting

نظام كاشير ومحاسبة لمطعم وجبات سريعة.

## المتطلبات

- Node.js
- MongoDB (يعمل محلياً على `mongodb://localhost:27017`)

## التشغيل

1. `cd backend && npm install`
2. أنشئ ملف `.env` في مجلد `backend` (أو استخدم الموجود):

```
MONGO_URI=mongodb://localhost:27017/fastfood-pos
PORT=5000
```

3. `node server.js` (أو `npm start`)
4. افتح المتصفح على [http://localhost:5000](http://localhost:5000)

## الصفحات

| الصفحة | المسار |
|--------|--------|
| الكاشير | `/index.html` |
| المنتجات | `/products.html` |
| الإحصائيات | `/dashboard.html` |

## API

- `GET/POST /api/products` — المنتجات
- `PUT/DELETE /api/products/:id` — تعديل / حذف
- `GET/POST /api/orders` — الطلبات
- `GET /api/orders/stats` — الإحصائيات
