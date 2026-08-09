# ربط الموقع بـ Firebase — الخطوات

الكود بتاع Firebase **جاهز خلاص جوه المشروع** (`src/lib/storageAdapters.ts`) — بيعمل push / pull / مزامنة لحظية للـ 7 جداول (menuItems, categories, extras, orders, customers, media, settings) بنفس الطريقة اللي شغالة بيها Supabase بالظبط.

الفرق إن Firebase (على عكس Supabase) محتاج تعمل مشروع بنفسك من الكونسول — معنديش وصول برمجي مباشر لـ Firebase عشان أعمله لك زي ما حصل مع Supabase، لكن جهزتلك كل حاجة تانية: قواعد الحماية (`firestore.rules`) وملفات الإعداد جاهزين جوه المشروع، ومحتاج منك بس الخطوات التالية (5 دقايق).

## الخطوات

### 1) اعمل مشروع Firebase
1. افتح https://console.firebase.google.com
2. **Add project** → اكتب اسم زي `mashhoor` → كمّل الخطوات (تقدر تسيب Google Analytics متفعلتش، مش لازمة هنا)

### 2) فعّل Firestore
1. من القائمة الجانبية: **Build → Firestore Database**
2. **Create database**
3. اختار **Start in production mode**
4. اختار المنطقة (Location) — الأقرب لمصر هو `eur3 (europe-west)` أو أي منطقة أوروبية متاحة

### 3) حط قواعد الحماية (Rules)
1. من نفس صفحة Firestore Database → تاب **Rules**
2. امسح اللي موجود، والصق بدله *المحتوى بالظبط* من ملف `firestore.rules` الموجود في المشروع
3. دوس **Publish**

> القواعد دي مطابقة لنفس فلسفة الحماية المستخدمة في Supabase بالظبط (RLS مفتوحة للقراءة/الكتابة) — لأن الموقع مفيهوش نظام تسجيل دخول حقيقي من Firebase، الأدمن بيدخل بباسورد محلي بس. تفاصيل أكتر مكتوبة كتعليق في أول الملف نفسه.

### 4) اجيب بيانات الويب أپ (API Key / Project ID / App ID)
1. من صفحة المشروع الرئيسية → أيقونة الترس ⚙️ → **Project settings**
2. تحت **Your apps** → دوس على أيقونة الويب `</>`
3. سمّي الأپ (أي اسم، مثلاً `mashhoor-web`) → **Register app**
4. هيظهرلك كود فيه `firebaseConfig` — منه هتاخد 3 حاجات بس:

```
apiKey:     "AIza..."
projectId:  "mashhoor-xxxxx"
appId:      "1:xxxxxxxxxx:web:xxxxxxxxxxxxxxxx"
```

### 5) حط البيانات في لوحة تحكم موقعك
1. افتح موقعك → لوحة التحكم (Admin) → الإعدادات → **Storage**
2. اختار **Firebase**
3. الصق الـ 3 قيم اللي جبتها فوق (API Key, Project ID, App ID)
4. دوس **حفظ**، وبعدين **مزامنة الآن** (أول مرة بس، بعد كده هتتزامن لوحدها تلقائي وهتشتغل حتى لحظياً بدون ريفريش زي Supabase بالظبط)

## ملحوظة أمان مهمة
- زي بالظبط ملحوظة Supabase: الـ API Key ده معرّف عام مش سر — بس متحطش الـ Project ID و API Key مع بعض في مكان عام (بوست فيسبوك، مستودع GitHub عام) لأنهم مع بعض بيفتحوا بوابة الكتابة على قاعدة البيانات
- لو حسيت إن حد وصل للبيانات دول، اقدر تلغي/تجدد الـ API Key من Project Settings في نفس الكونسول

## الملفات اللي جهزتلك جوه المشروع
- `firestore.rules` — قواعد الحماية الجاهزة للصق في الخطوة 3
- `firestore.indexes.json` — فاضي عمدًا؛ الكود الحالي بيقرا كل الكوليكشن مرة واحدة من غير استعلامات معقدة، فمحتاجش إندكسات إضافية
- `firebase.json` — لو حبيت تستخدم Firebase CLI بدل اللصق اليدوي (`firebase deploy --only firestore:rules`)

## لو حابب تفعّل حماية حقيقية بعدين (اختياري)
دلوقتي أي حد معاه API Key + Project ID يقدر يكتب على القاعدة (مفيش تسجيل دخول حقيقي). لو حبيت تقفلها أكتر مستقبلاً، محتاج:
1. تفعّل Firebase Authentication (مثلاً تسجيل دخول بالإيميل للأدمن)
2. تعدّل `firestore.rules` بحيث الكتابة على `menuItems/categories/extras/media/settings` تتطلب `request.auth != null`
3. تعدّل `storageAdapters.ts` بحيث الـ fetch calls تبعت توكن المصادقة

مش لازم دلوقتي — الموقع هيشتغل تمام من غيرها، بالظبط زي إعداد Supabase الحالي.
