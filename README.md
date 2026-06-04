# FastPOS — Fast Food Restaurant POS & Accounting

نظام كاشير ومحاسبة لمطعم وجبات سريعة.

## المتطلبات

- Node.js
- MongoDB ([MongoDB Atlas](https://www.mongodb.com/cloud/atlas) للنشر على Vercel)

## التشغيل محلياً

1. `cd backend && npm install`
2. انسخ `backend/.env.example` إلى `backend/.env`:

```
MONGO_URI=mongodb://localhost:27017/fastfood-pos
PORT=5000
```

3. `npm start` من مجلد `backend`
4. افتح [http://localhost:5000](http://localhost:5000)

## النشر على Vercel

1. اربط المستودع: [github.com/Abdo-Mo2/Casher](https://github.com/Abdo-Mo2/Casher)
2. في [Vercel Dashboard](https://vercel.com) → Import Project → اختر **Casher**
3. أضف متغير البيئة:
   - `MONGO_URI` = رابط MongoDB Atlas (مثال: `mongodb+srv://user:pass@cluster.mongodb.net/fastfood-pos`)
4. Deploy

أو من الطرفية:

```bash
npm install -g vercel
vercel login
vercel --prod
```

عند الطلب، أضف `MONGO_URI` في إعدادات المشروع على Vercel.

**ملاحظة:** على Vercel تُخزَّن صور المنتجات في قاعدة البيانات (Base64). محلياً تُحفظ في `backend/uploads/`.

## الصفحات

| الصفحة | المسار |
|--------|--------|
| الكاشير | `/` أو `/index.html` |
| المنتجات | `/products.html` |
| الإحصائيات | `/dashboard.html` |

## API

- `GET/POST /api/products` — المنتجات
- `PUT/DELETE /api/products/:id` — تعديل / حذف
- `GET/POST /api/orders` — الطلبات
- `GET /api/orders/stats` — الإحصائيات
