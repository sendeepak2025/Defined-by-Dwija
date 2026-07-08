const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, message: "Method not allowed" });
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

    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.success) {
      return res.status(response.status || 502).json({
        success: false,
        message: result.message || "Inquiry could not be sent.",
      });
    }

    return res.status(200).json({ success: true, message: "Inquiry sent." });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Inquiry could not be sent." });
  }
};