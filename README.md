# Excel Editor Web Application

یک ویرایشگر اکسل تحت وب با قابلیت‌های پیشرفته

## ویژگی‌ها

- ویرایش مستقیم فایل‌های اکسل در مرورگر
- پشتیبانی از چندین شیت
- امکان افزودن، حذف و کپی شیت‌ها
- جستجو در داده‌ها
- پنل مدیریت با رمز عبور
- ذخیره و دانلود فایل‌ها
- رابط کاربری فارسی و RTL

## نصب و راه‌اندازی

### نصب محلی

```bash
# کلون کردن پروژه
git clone https://github.com/pmkh84/rasad-web6.git
cd rasad-web6

# نصب وابستگی‌ها
npm install

# اجرای پروژه در حالت توسعه
npm run dev

# ساخت پروژه برای تولید
npm run build

# اجرای سرور تولید
npm start
```

### استقرار در Render.com

1. پروژه را در GitHub قرار دهید
2. در Render.com یک Web Service جدید ایجاد کنید
3. مخزن GitHub را متصل کنید
4. تنظیمات زیر را اعمال کنید:

**Build Command:**
```
npm install && npm run build
```

**Start Command:**
```
npm start
```

**Environment:**
- Node.js

## استفاده

### ورود به پنل مدیریت
- رمز عبور پیش‌فرض: `admin123`

### عملیات پشتیبانی شده
- ویرایش سلول‌ها با دابل کلیک
- استفاده از فرمول‌های ساده (=A1+B1)
- جستجو در داده‌ها
- افزودن/حذف شیت (فقط مدیر)
- ذخیره تغییرات
- دانلود فایل اکسل

## ساختار پروژه

```
src/
├── components/          # کامپوننت‌های React
│   ├── ui/             # کامپوننت‌های رابط کاربری
│   ├── ExcelEditor.tsx # ویرایشگر اصلی
│   ├── DataGrid.tsx    # جدول داده‌ها
│   └── ...
├── utils/              # توابع کمکی
└── styles/             # فایل‌های CSS

public/
└── data/               # فایل‌های اکسل
```

## تکنولوژی‌های استفاده شده

- **Frontend:** React 18, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express
- **Excel Processing:** SheetJS (XLSX)
- **Icons:** Lucide React
- **Build Tool:** Vite

## مجوز

این پروژه تحت مجوز MIT منتشر شده است.