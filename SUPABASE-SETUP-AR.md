# بيانات Supabase الخاصة بمشروعك — جاهزة للربط

تم إنشاء مشروع Supabase وكل الجداول المطلوبة بالفعل. مطلوب منك خطوة واحدة بس: تحط البيانات دي في لوحة التحكم بموقعك.

## الخطوات
1. افتح موقعك → لوحة التحكم (Admin) → الإعدادات → **Storage**
2. اختار **Supabase**
3. الصق البيانات دي بالظبط:

```
Project URL: https://ihhhisyiukzoalitrfqj.supabase.co
Anon Key:    eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloaGhpc3lpdWt6b2FsaXRyZnFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyNTQ5NDgsImV4cCI6MjEwMTgzMDk0OH0.AP2_wzsSSZgWTviOkrsRAHkfyk_Im8MF78EvHe1DuIs
```

4. دوس **حفظ**، وبعدين **مزامنة الآن** (أول مرة بس، بعد كده هتتزامن لوحدها تلقائي)

## اللي اتعمل جوه Supabase (خلاص، مش محتاج تعمل حاجة)
- تم إنشاء مشروع باسم `mashhoor` في منطقة فرانكفورت (eu-central-1) — أقرب منطقة لمصر
- تم إنشاء كل الجداول المطلوبة: `settings`, `menuItems`, `categories`, `extras`, `orders`, `customers`, `media`
- كل جدول فيه عمودين: `id` (text) و`value` (jsonb) — زي ما موضح بالظبط في CHANGELOG-AR.md
- تم تفعيل الحماية (RLS) مع صلاحيات قراءة/كتابة تسمح للموقع يشتغل بشكل طبيعي
- تم تفعيل **Realtime** على كل الجداول عشان التحديث اللحظي (بدون ريفريش) يشتغل فورًا مع كل زوار الموقع

## ملحوظة أمان مهمة
- الـ Anon Key ده آمن الاستخدام جوه كود الموقع نفسه (ده تصميمه الأصلي من Supabase)
- بس متحطش الرابط ده في مكان عام زي بوست فيسبوك أو مستودع GitHub عام مع تفاصيل تانية حساسة
- لو حبيت تراجع أو تدير المشروع مباشرة: https://supabase.com/dashboard/project/ihhhisyiukzoalitrfqj

## لو حابب تربط Firebase كمان
نفس الفكرة، بس من نفس التاب (Storage) تختار Firebase وتحط بياناته (API Key / Project ID / App ID) — مفيش أي إعداد إضافي مطلوب من جهتك على Firebase نفسه، هيشتغل لوحده زي ما موضح في CHANGELOG-AR.md.
