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
          caption: message,
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
        text: message,
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
