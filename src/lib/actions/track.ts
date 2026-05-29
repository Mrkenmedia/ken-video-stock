"use server";

import { headers } from 'next/headers';

export async function trackVisitAction(info: { url: string; referrer: string; screen: string; language: string; userAgent: string }, enabled: boolean) {
  try {
    if (!enabled) return; // Không gửi nếu bị tắt trong cài đặt

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    if (!token || !chatId) {
      console.log("Thiếu cấu hình TELEGRAM_BOT_TOKEN hoặc TELEGRAM_CHAT_ID trong .env.local");
      return;
    }

    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || 'Unknown IP';
    
    let location = 'Không xác định';
    if (ip && ip !== 'Unknown IP' && ip !== '::1' && ip !== '127.0.0.1') {
      try {
        const realIp = ip.split(',')[0].trim();
        const geoRes = await fetch(`http://ip-api.com/json/${realIp}?fields=status,country,city`);
        const geoData = await geoRes.json();
        if (geoData.status === 'success') {
          location = `${geoData.city}, ${geoData.country}`;
        }
      } catch (e) {
        console.error("Lỗi lấy vị trí:", e);
      }
    }

    // Rút gọn user agent
    const isMobile = /Mobile|Android|iP(ad|hone)/.test(info.userAgent) ? "📱 Mobile" : "💻 Desktop";
    let browser = "Unknown";
    if (info.userAgent.includes("Chrome")) browser = "Chrome";
    else if (info.userAgent.includes("Safari")) browser = "Safari";
    else if (info.userAgent.includes("Firefox")) browser = "Firefox";
    else if (info.userAgent.includes("Edge")) browser = "Edge";

    const message = `🚨 *Khách mới truy cập Website*\n\n` +
                    `🔗 *URL:* ${info.url}\n` +
                    `⬅️ *Nguồn:* ${info.referrer}\n` +
                    `📍 *Vị trí:* ${location} (IP: ${ip.split(',')[0].trim()})\n` +
                    `🌐 *Trình duyệt:* ${browser} (${info.language})\n` +
                    `🖥 *Thiết bị:* ${isMobile} (${info.screen})`;

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown"
      })
    });
  } catch (e) {
    console.error("Lỗi gửi thông báo Telegram:", e);
  }
}
