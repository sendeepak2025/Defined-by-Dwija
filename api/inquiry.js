const WEBSITE_NAME = "Defined by Dwija";
const TO_EMAIL = "jayvekariya2003@gmail.com";
const EMAIL_API_ENDPOINT =
  // process.env.INQUIRY_EMAIL_API_URL || "https://subconsciously-unsuppressible-precious.ngrok-free.dev/api/send";
  process.env.INQUIRY_EMAIL_API_URL || "https://mail-shared.varnsolutions.com/api/send";
const EMAIL_API_KEY = process.env.INQUIRY_EMAIL_API_KEY || "test-api-key-website1-12345";
const EMAIL_API_TIMEOUT_MS = 9000;
const MAX_PAYLOAD_BYTES = 12 * 1024;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;

const ALLOWED_ORIGINS = new Set([
  "https://definedbydwija.com",
  "https://www.definedbydwija.com",
  "https://defined-by-dwija.vercel.app",
  "https://defined-by-dwija-iota.vercel.app",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
  "http://localhost:5501",
  "http://127.0.0.1:5501",
]);

const FIELD_LIMITS = {
  name: 120,
  email: 160,
  phone: 40,
  eventType: 80,
  eventDate: 20,
  readyTime: 20,
  location: 220,
  party: 140,
  trialNeeded: 20,
  heardFrom: 80,
  notes: 1500,
  websiteName: 80,
};

const rateStore = globalThis.__definedByDwijaInquiryRateStore || new Map();
globalThis.__definedByDwijaInquiryRateStore = rateStore;

function setSecurityHeaders(res, origin) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("X-Robots-Tag", "noindex");
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
    res.setHeader("Vary", "Origin");
  }
}

function sendJson(res, statusCode, message, success = false) {
  return res.status(statusCode).json({ success, message });
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

function isRateLimited(ip) {
  const now = Date.now();
  const current = rateStore.get(ip) || [];
  const recent = current.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
    rateStore.set(ip, recent);
    return true;
  }
  recent.push(now);
  rateStore.set(ip, recent);
  return false;
}

function byteLength(value) {
  return Buffer.byteLength(typeof value === "string" ? value : JSON.stringify(value || {}), "utf8");
}

function parseBody(req) {
  if (!req.body || typeof req.body === "object") return req.body || {};
  if (typeof req.body !== "string") throw new Error("Invalid JSON payload.");
  try {
    return JSON.parse(req.body);
  } catch (error) {
    const invalid = new Error("Invalid JSON payload.");
    invalid.statusCode = 400;
    throw invalid;
  }
}

function normalizeText(value, maxLength, { multiline = false } = {}) {
  const controlPattern = multiline ? /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g : /[\u0000-\u001F\u007F]/g;
  return String(value || "")
    .replace(controlPattern, " ")
    .replace(multiline ? /[ \t]+/g : /\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email) && !/[\r\n]/.test(email);
}

function isValidPhone(phone) {
  return /^\+?[0-9()\-\s.]{7,24}$/.test(phone) && phone.replace(/\D/g, "").length >= 7;
}

function sanitizeServices(services) {
  const raw = Array.isArray(services) ? services : [];
  return raw
    .map((service) => normalizeText(service, 80))
    .filter(Boolean)
    .slice(0, 12);
}

function validateAndSanitize(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Invalid payload." };
  }

  const data = {
    name: normalizeText(body.name, FIELD_LIMITS.name),
    email: normalizeText(body.email, FIELD_LIMITS.email).toLowerCase(),
    phone: normalizeText(body.phone, FIELD_LIMITS.phone),
    eventType: normalizeText(body.eventType, FIELD_LIMITS.eventType),
    eventDate: normalizeText(body.eventDate, FIELD_LIMITS.eventDate),
    readyTime: normalizeText(body.readyTime, FIELD_LIMITS.readyTime),
    location: normalizeText(body.location, FIELD_LIMITS.location),
    services: sanitizeServices(body.services),
    party: normalizeText(body.party, FIELD_LIMITS.party),
    trialNeeded: normalizeText(body.trialNeeded, FIELD_LIMITS.trialNeeded),
    heardFrom: normalizeText(body.heardFrom, FIELD_LIMITS.heardFrom) || "Not provided",
    notes: normalizeText(body.notes, FIELD_LIMITS.notes, { multiline: true }) || "No additional notes provided.",
    websiteName: normalizeText(body.websiteName, FIELD_LIMITS.websiteName) || WEBSITE_NAME,
    formStartedAt: Number(body.formStartedAt || 0),
  };

  if (!data.name) return { error: "Name is required." };
  if (!isValidEmail(data.email)) return { error: "A valid email address is required." };
  if (!isValidPhone(data.phone)) return { error: "A valid phone number is required." };
  if (!data.eventType) return { error: "Event type is required." };
  if (!data.eventDate) return { error: "Event date is required." };
  if (!data.readyTime) return { error: "Ready time is required." };
  if (!data.location) return { error: "Event location is required." };
  if (!data.services.length) return { error: "At least one service is required." };
  if (!data.party) return { error: "Number of people requiring services is required." };
  if (!data.trialNeeded) return { error: "Trial needed selection is required." };

  const elapsedMs = Date.now() - data.formStartedAt;
  if (!Number.isFinite(elapsedMs) || elapsedMs < 1200) {
    return { error: "Please review your details and try submitting again." };
  }

  const linkCount = (data.notes.match(/https?:\/\//gi) || []).length;
  if (linkCount > 3) return { error: "Please remove extra links from the notes field." };

  return { data };
}

function buildEmailPayload(data) {
  const subjectName = data.name.replace(/[\r\n]/g, " ").slice(0, 80);
  const subject = `Defined by Dwija inquiry from ${subjectName}`;

  return {
    to: TO_EMAIL,
    subject,
    template: "contact",
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      eventType: data.eventType,
      eventDate: data.eventDate,
      readyTime: data.readyTime,
      location: data.location,
      services: data.services.join(", "),
      party: data.party,
      trialNeeded: data.trialNeeded,
      heardFrom: data.heardFrom,
      notes: data.notes,
      timestamp: new Date().toLocaleString("en-CA", { timeZone: "America/Vancouver", dateStyle: "medium", timeStyle: "short" }),
      websiteName: data.websiteName,
    },
  };
}

module.exports = async function handler(req, res) {
  const origin = req.headers.origin;
  setSecurityHeaders(res, origin);

  if (req.method === "OPTIONS") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return sendJson(res, 405, "Method not allowed.");
  }

  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return sendJson(res, 403, "This origin is not allowed to submit inquiries.");
  }

  const contentLength = Number(req.headers["content-length"] || 0);
  if (contentLength > MAX_PAYLOAD_BYTES) {
    return sendJson(res, 413, "Inquiry payload is too large.");
  }

  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return sendJson(res, 429, "Too many inquiry attempts. Please try again later.");
  }

  if (!EMAIL_API_ENDPOINT || !EMAIL_API_KEY) {
    return sendJson(res, 500, "Inquiry email service is not configured.");
  }

  let body;
  try {
    body = parseBody(req);
  } catch (error) {
    return sendJson(res, error.statusCode || 400, "Invalid JSON payload.");
  }

  if (byteLength(body) > MAX_PAYLOAD_BYTES) {
    return sendJson(res, 413, "Inquiry payload is too large.");
  }

  const { data, error } = validateAndSanitize(body);
  if (error) return sendJson(res, 400, error);

  const emailPayload = buildEmailPayload(data);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), EMAIL_API_TIMEOUT_MS);

  try {
    const response = await fetch(EMAIL_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": EMAIL_API_KEY,
      },
      body: JSON.stringify(emailPayload),
      signal: controller.signal,
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return sendJson(res, 500, "Inquiry email service is not configured correctly.");
      }
      if (response.status === 429) {
        return sendJson(res, 429, "Email service is busy. Please try again shortly.");
      }
      return sendJson(res, 500, result.message || result.error || "Inquiry could not be sent.");
    }

    return sendJson(res, 200, "Inquiry sent successfully.", true);
  } catch (error) {
    if (error.name === "AbortError") {
      return sendJson(res, 408, "Inquiry request timed out. Please try again.");
    }
    return sendJson(res, 500, "Inquiry could not be sent.");
  } finally {
    clearTimeout(timeout);
  }
};
