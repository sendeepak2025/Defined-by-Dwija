const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";
const DEFAULT_ALLOWED_ORIGINS = [
  "https://defined-by-dwija-iota.vercel.app",
  "https://definedbydwija.com",
  "https://www.definedbydwija.com",
];

function getAllowedOrigins() {
  return (process.env.ALLOWED_ORIGINS || DEFAULT_ALLOWED_ORIGINS.join(","))
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const origin = req.headers.origin;
  const allowedOrigins = getAllowedOrigins();
  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({ success: false, message: "This origin is not allowed to submit inquiries." });
  }

  const accessKey = process.env.WEB3FORMS_ACCESS_KEY;
  if (!accessKey) {
    return res.status(500).json({ success: false, message: "Inquiry service is not configured." });
  }

  try {
    const payload = {
      ...req.body,
      access_key: accessKey,
    };

    const response = await fetch(WEB3FORMS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    let result = {};
    try {
      result = responseText ? JSON.parse(responseText) : {};
    } catch (error) {
      result = { message: responseText };
    }

    if (!response.ok || !result.success) {
      return res.status(response.status || 502).json({
        success: false,
        message: result.message || `Web3Forms rejected the inquiry with status ${response.status}.`,
      });
    }

    return res.status(200).json({ success: true, message: "Inquiry sent." });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Inquiry could not be sent." });
  }
};