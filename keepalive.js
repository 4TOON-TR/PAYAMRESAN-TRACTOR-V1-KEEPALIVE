const https = require('https');
const http = require('http');

// ============================================================
//  تنظیمات
// ============================================================

// آدرس سرور خود را اینجا قرار دهید
const SERVER_URL = process.env.SERVER_URL || 'https://your-app-name.onrender.com';

// زمان بین هر پینگ (5 دقیقه)
const PING_INTERVAL = 5 * 60 * 1000; // 5 دقیقه

// ============================================================
//  تابع پینگ
// ============================================================

function pingServer() {
    const url = new URL(SERVER_URL);
    const protocol = url.protocol === 'https:' ? https : http;

    const startTime = Date.now();

    const request = protocol.get(SERVER_URL, (res) => {
        const duration = Date.now() - startTime;
        console.log(`✅ پینگ موفق - وضعیت: ${res.statusCode} - زمان: ${duration}ms - ${new Date().toLocaleTimeString('fa-IR')}`);
        
        // اگر وضعیت 200 نبود، لاگ کن
        if (res.statusCode !== 200) {
            console.log(`⚠️ وضعیت غیرعادی: ${res.statusCode}`);
        }
    });

    request.on('error', (err) => {
        console.log(`❌ خطا در پینگ: ${err.message} - ${new Date().toLocaleTimeString('fa-IR')}`);
    });

    // تایم‌اوت 10 ثانیه
    request.setTimeout(10000, () => {
        request.destroy();
        console.log(`⏰ تایم‌اوت پینگ - ${new Date().toLocaleTimeString('fa-IR')}`);
    });

    request.end();
}

// ============================================================
//  پینگ به چند آدرس مختلف (برای اطمینان بیشتر)
// ============================================================

function pingMultipleEndpoints() {
    // پینگ به آدرس اصلی
    pingServer();

    // پینگ به API کاربران (برای تست API)
    const apiUrl = `${SERVER_URL}/api/users`;
    const url = new URL(apiUrl);
    const protocol = url.protocol === 'https:' ? https : http;

    const request = protocol.get(apiUrl, (res) => {
        console.log(`✅ پینگ API - وضعیت: ${res.statusCode}`);
    });

    request.on('error', (err) => {
        console.log(`❌ خطا در پینگ API: ${err.message}`);
    });

    request.setTimeout(10000, () => {
        request.destroy();
    });

    request.end();
}

// ============================================================
//  تابع Keep-Alive با استراتژی هوشمند
// ============================================================

let consecutiveFailures = 0;
const MAX_FAILURES = 3;

function smartPing() {
    const url = new URL(SERVER_URL);
    const protocol = url.protocol === 'https:' ? https : http;

    const startTime = Date.now();

    const request = protocol.get(SERVER_URL, (res) => {
        const duration = Date.now() - startTime;
        
        if (res.statusCode === 200) {
            consecutiveFailures = 0;
            console.log(`✅ سرور بیدار است - ${new Date().toLocaleTimeString('fa-IR')}`);
        } else {
            consecutiveFailures++;
            console.log(`⚠️ وضعیت غیرعادی: ${res.statusCode} - تلاش ${consecutiveFailures}`);
        }
    });

    request.on('error', (err) => {
        consecutiveFailures++;
        console.log(`❌ خطا در پینگ: ${err.message} - تلاش ${consecutiveFailures}`);
        
        // اگر چند بار متوالی خطا داشت، با فاصله بیشتری تلاش کن
        if (consecutiveFailures >= MAX_FAILURES) {
            console.log(`🔴 ${MAX_FAILURES} بار خطا! افزایش زمان پینگ...`);
            // ریست کردن کانکشن بعدی با تاخیر بیشتر
            setTimeout(smartPing, PING_INTERVAL * 2);
            return;
        }
    });

    request.setTimeout(10000, () => {
        request.destroy();
        consecutiveFailures++;
        console.log(`⏰ تایم‌اوت پینگ - تلاش ${consecutiveFailures}`);
    });

    request.end();
}

// ============================================================
//  شروع سرویس Keep-Alive
// ============================================================

console.log('========================================');
console.log(`🔄 سرویس Keep-Alive برای ${SERVER_URL}`);
console.log(`⏱️ پینگ هر ${PING_INTERVAL / 60000} دقیقه`);
console.log(`📅 شروع: ${new Date().toLocaleString('fa-IR')}`);
console.log('========================================');

// پینگ اولیه (بلافاصله)
setTimeout(() => {
    smartPing();
}, 1000);

// تنظیم تایمر اصلی
setInterval(smartPing, PING_INTERVAL);

// ============================================================
//  پینگ اضافی با روش‌های مختلف (برای اطمینان بیشتر)
// ============================================================

// هر 30 دقیقه یکبار، یک پینگ به API بزن
setInterval(() => {
    console.log(`🔄 پینگ اضافی به API...`);
    pingMultipleEndpoints();
}, 30 * 60 * 1000);

// هر ساعت یکبار، وضعیت کلی را گزارش کن
setInterval(() => {
    console.log(`📊 وضعیت سرویس: ${consecutiveFailures} خطای متوالی`);
    console.log(`📅 زمان: ${new Date().toLocaleString('fa-IR')}`);
}, 60 * 60 * 1000);

// ============================================================
//  مدیریت خطاهای سیستمی
// ============================================================

process.on('uncaughtException', (err) => {
    console.log(`💥 خطای سیستمی: ${err.message}`);
    // ادامه بده، متوقف نشو
});

process.on('unhandledRejection', (reason, promise) => {
    console.log(`💥 پرامیس بدون مدیریت: ${reason}`);
});

console.log('✅ سرویس Keep-Alive با موفقیت راه‌اندازی شد!');