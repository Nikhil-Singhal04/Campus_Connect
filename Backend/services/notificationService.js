function formatRegistrationMessage({ fullName, event, pricingLabel }) {
  const title = event?.title || "this event";
  const date = event?.date || "TBA";
  const time = event?.time || "TBA";
  const location = event?.location || "TBA";
  const fee = pricingLabel || "Free";

  return `Hi ${fullName || "there"}! Your registration is confirmed for ${title}. Date: ${date}, Time: ${time}, Location: ${location}. Fee: ${fee}.`;
}

async function sendEmailConfirmation({ resend, to, fullName, event, pricingLabel }) {
  if (!resend) return { ok: false, skipped: true };

  const from = String(process.env.RESEND_FROM_EMAIL || "").trim();
  if (!from || !to) return { ok: false, skipped: true };

  const subject = `Registration confirmed: ${event?.title || "Campus Connect event"}`;
  const message = formatRegistrationMessage({ fullName, event, pricingLabel });

  await resend.emails.send({
    from,
    to,
    subject,
    text: message
  });

  return { ok: true };
}

async function sendRegistrationNotifications({ resend, fullName, email, event, pricingLabel }) {
  const results = await Promise.allSettled([
    sendEmailConfirmation({ resend, to: email, fullName, event, pricingLabel })
  ]);
  return results.map((result) => (result.status === "fulfilled" ? result.value : { ok: false }));
}

module.exports = {
  sendRegistrationNotifications
};
