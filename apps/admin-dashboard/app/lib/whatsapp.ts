const WA_SERVER_URL = process.env.WA_SERVER_URL || '';
const WA_API_KEY = process.env.WA_API_KEY || '';

export async function sendWhatsApp(options: { to: string; text: string }) {
  const { to, text } = options;

  // Format phone: remove +, ensure country code
  const chatId = `${to.replace(/\D/g, '')}@c.us`;

  if (!WA_SERVER_URL) {
    console.log(`
--- 🔵 SIMULATION WHATSAPP ---
TO: ${to}
MSG: ${text}
------------------------------
    `);
    return { success: true, messageId: `wa_sim_${Date.now()}` };
  }

  try {
    const res = await fetch(`${WA_SERVER_URL}/sendText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(WA_API_KEY ? { 'Authorization': `Bearer ${WA_API_KEY}` } : {}),
      },
      body: JSON.stringify({ chatId, text }),
    });

    const data = await res.json();
    return { success: res.ok, messageId: data?.messageId || `wa_${Date.now()}` };
  } catch (err: any) {
    console.error('[WHATSAPP ERROR]', err.message);
    return { success: false, error: err.message };
  }
}
