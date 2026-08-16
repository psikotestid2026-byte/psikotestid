import { sql } from '@/lib/neon';

export interface TelegramNotifyParams {
  message: string;
  imageUrl?: string | null;
}

export async function sendTelegramNotification({ message, imageUrl }: TelegramNotifyParams): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN || '8755772988:AAHniVOQQXtzcEQEf3fWL-kO_QJt6CxpjEE';
  const chatId = process.env.TELEGRAM_CHAT_ID || '-5494766278';

  if (!token || !chatId) {
    console.warn('Telegram bot configuration missing (TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID).');
    return false;
  }

  // Convert HTML breaks to newlines for Telegram Markdown/HTML formatting
  const formattedMessage = message.replace(/<br\s*\/?>/gi, '\n');

  try {
    // If imageUrl is provided, attempt sending photo with caption first
    if (imageUrl) {
      const photoUrl = `https://api.telegram.org/bot${token}/sendPhoto`;
      const photoRes = await fetch(photoUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          photo: imageUrl,
          caption: formattedMessage,
          parse_mode: 'HTML',
        }),
      });

      if (photoRes.ok) {
        return true;
      }
      console.warn('sendPhoto failed, falling back to sendMessage:', await photoRes.text());
    }

    // Fallback to sending text message
    const messageUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(messageUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: formattedMessage,
        parse_mode: 'HTML',
      }),
    });

    if (!res.ok) {
      console.error('Telegram sendMessage Error:', await res.text());
      return false;
    }

    return true;
  } catch (err) {
    console.error('Failed to send Telegram notification:', err);
    return false;
  }
}

// Dynamic Telegram Notification Loader from notification_templates Table
export async function sendDynamicTelegramNotification(
  eventTrigger: string,
  params: Record<string, any>,
  imageUrl?: string | null
): Promise<boolean> {
  let messageContent = '';

  try {
    // Fetch template from database via RAW SQL
    const tplRows = await sql`
      SELECT message_content FROM notification_templates
      WHERE event_trigger = ${eventTrigger} AND is_active = true
      LIMIT 1
    `;

    if (tplRows.length > 0 && tplRows[0].message_content) {
      messageContent = tplRows[0].message_content;
    }
  } catch (err) {
    console.error(`Failed to fetch ${eventTrigger} template from DB:`, err);
  }

  // Replace placeholders dynamically
  if (messageContent) {
    Object.keys(params).forEach((key) => {
      const val = params[key] !== undefined && params[key] !== null ? String(params[key]) : '';
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      messageContent = messageContent.replace(regex, val);
    });
  } else {
    // Hardcoded fallback if DB template missing
    if (eventTrigger === 'TELEGRAM_NEW_ORDER') {
      messageContent = `
<b>🚨 ORDER BARU MASUK (PENDING) 🚨</b><br/><br/>
• <b>Invoice:</b> <code>${params.invoice_code || ''}</code><br/>
• <b>Klien HR:</b> ${params.company_name || ''} (${params.customer_email || ''})<br/>
• <b>Jenis Order:</b> ${params.order_type || ''}<br/>
• <b>Nominal Presisi:</b> <b>Rp ${params.total_amount || ''}</b><br/>
• <b>Metode Bayar:</b> ${params.payment_method || 'Transfer Bank BCA'}<br/>
• <b>Status:</b> Menunggu Pembayaran Transfer
      `.trim();
    } else if (eventTrigger === 'TELEGRAM_PAYMENT_PROOF') {
      messageContent = `
<b>📸 BUKTI TRANSFER UNGGAH BARU! 📸</b><br/><br/>
• <b>Invoice:</b> <code>${params.invoice_code || ''}</code><br/>
• <b>Klien HR:</b> ${params.company_name || ''} (${params.customer_email || ''})<br/>
• <b>Nominal Presisi:</b> <b>Rp ${params.total_amount || ''}</b><br/>
• <b>Bukti Foto:</b> <a href="${params.proof_url || '#'}">Lihat Gambar Bukti</a>
      `.trim();
    }
  }

  return sendTelegramNotification({
    message: messageContent,
    imageUrl: imageUrl || params.proof_url,
  });
}
