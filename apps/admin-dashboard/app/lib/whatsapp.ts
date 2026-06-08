import { prisma } from '@coffeeshop/database';

export async function getWAConfig() {
  try {
    const settings = await (prisma as any).systemSettings.findUnique({
      where: { id: 'global' }
    });
    if (settings && settings.waServerUrl) {
      return {
        serverUrl: settings.waServerUrl,
        apiKey: settings.waApiKey || '',
      };
    }
  } catch (err) {
    console.error("Error fetching WA config from DB", err);
  }
  return {
    serverUrl: process.env.WA_SERVER_URL || '',
    apiKey: process.env.WA_API_KEY || '',
  };
}

export async function sendWhatsApp(options: { to: string; text: string }) {
  const { to, text } = options;

  const chatId = `${to.replace(/\D/g, '')}@c.us`;
  const config = await getWAConfig();

  if (!config.serverUrl) {
    console.log(`
--- 🔵 SIMULATION WHATSAPP ---
TO: ${to}
MSG: ${text}
------------------------------
    `);
    return { success: true, messageId: `wa_sim_${Date.now()}` };
  }

  try {
    const res = await fetch(`${config.serverUrl}/sendText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey ? { 'Authorization': `Bearer ${config.apiKey}` } : {}),
      },
      body: JSON.stringify({ chatId, text }),
    });

    const data = await res.json();
    const messageId = data?.messageId || `wa_${Date.now()}`;
    const status = res.ok ? 'SENT' : 'FAILED';

    await logWhatsApp({ to, text, status, messageId, error: res.ok ? undefined : data?.error });

    return { success: res.ok, messageId };
  } catch (err: any) {
    console.error('[WHATSAPP ERROR]', err.message);
    await logWhatsApp({ to, text, status: 'FAILED', error: err.message });
    return { success: false, error: err.message };
  }
}

async function logWhatsApp(data: { to: string; text: string; status: string; messageId?: string; error?: string }) {
  try {
    await (prisma as any).whatsAppLog.create({
      data: {
        to: data.to,
        message: data.text,
        status: data.status,
        messageId: data.messageId,
        error: data.error,
      },
    });
  } catch (err) {
    console.error('Failed to log WhatsApp message', err);
  }
}
