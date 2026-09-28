async function sendWhatsAppAPI(phone, message) {
  // TODO: Twilio / WATI / AiSensy — college decide karega
  // Example Twilio:
  // const client = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
  // await client.messages.create({
  //   from: 'whatsapp:+14155238886',
  //   to: `whatsapp:+91${phone}`,
  //   body: message
  // });
  console.log(`[WhatsApp] Would send to ${phone}: ${message}`);
}

module.exports = { sendWhatsAppAPI };