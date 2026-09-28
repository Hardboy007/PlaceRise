// WhatsApp utility
// Abhi wa.me links use ho rahe hain (Option 2)
// Jab college WhatsApp Business API dega — sirf ye file update karni hai

export function sendWhatsAppMessage(phone, message) {
  if (!phone) return;
  const cleaned = phone.replace(/\D/g, "");
  const number = cleaned.startsWith("91") ? cleaned : `91${cleaned}`;
  const encoded = encodeURIComponent(message);
  
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  
  if (isMobile) {
    // Phone pe — WhatsApp app directly
    window.open(`whatsapp://send?phone=${number}&text=${encoded}`, "_blank");
  } else {
    // Desktop pe — WhatsApp Web
    window.open(`https://web.whatsapp.com/send?phone=${number}&text=${encoded}`, "_blank");
  }
}

export function getWhatsAppLink(phone, message = "") {
  if (!phone) return "#";
  const cleaned = phone.replace(/\D/g, "");
  const number = cleaned.startsWith("91") ? cleaned : `91${cleaned}`;
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${number}?text=${encoded}`;
}

// Bulk — ek ek karke sabko open karega
export function sendBulkWhatsApp(students, message) {
  students.forEach((student, i) => {
    if (!student.phone) return;
    setTimeout(() => {
      sendWhatsAppMessage(student.phone, message);
    }, i * 500); // 500ms delay between each
  });
}

export function shareOnWhatsApp(message) {
  const encoded = encodeURIComponent(message);
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isMobile) {
    window.open(`whatsapp://send?text=${encoded}`, "_blank");
  } else {
    window.open(`https://web.whatsapp.com/send?text=${encoded}`, "_blank");
  }
}