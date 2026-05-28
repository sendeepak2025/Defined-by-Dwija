const header = document.querySelector("[data-header]");
const navToggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".primary-nav");
const filterButtons = document.querySelectorAll("[data-filter]");
const galleryItems = document.querySelectorAll(".gallery figure");
const inquiryForm = document.querySelector("[data-inquiry-form]");
const formStatus = document.querySelector("[data-form-status]");
const servicesSelect = document.querySelector("[data-services-select]");
const servicesSummary = document.querySelector("[data-services-summary]");
const serviceOptions = document.querySelectorAll("[data-service-option]");
const lightbox = document.querySelector("[data-lightbox-modal]");
const lightboxImage = document.querySelector("[data-lightbox-image]");
const lightboxClose = document.querySelector("[data-lightbox-close]");

const updateHeader = () => {
  if (!header) return;
  header.classList.toggle("scrolled", window.scrollY > 24);
};

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    header.classList.toggle("menu-open", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  nav.addEventListener("click", (event) => {
    if (event.target.matches("a")) {
      nav.classList.remove("open");
      header.classList.remove("menu-open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });
}

const setPortfolioFilter = (filter) => {
  filterButtons.forEach((item) => item.classList.toggle("active", item.dataset.filter === filter));
  galleryItems.forEach((item) => {
    item.classList.toggle("hidden", filter !== "all" && item.dataset.category !== filter);
  });
};

if (filterButtons.length && galleryItems.length) {
  const params = new URLSearchParams(window.location.search);
  const initialFilter = params.get("filter") || "all";
  const validFilter = [...filterButtons].some((button) => button.dataset.filter === initialFilter) ? initialFilter : "all";
  setPortfolioFilter(validFilter);

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setPortfolioFilter(button.dataset.filter);
      if (button.closest(".portfolio-category-grid")) {
        document.querySelector("#portfolio-gallery")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
}

document.querySelectorAll(".accordion-trigger").forEach((trigger) => {
  trigger.addEventListener("click", () => {
    trigger.closest(".service-panel").classList.toggle("open");
  });
});

document.querySelectorAll("[data-lightbox]").forEach((button) => {
  button.addEventListener("click", () => {
    if (!lightbox || !lightboxImage) return;
    const image = button.querySelector("img");
    lightboxImage.src = image.src;
    lightboxImage.alt = image.alt;
    lightbox.hidden = false;
  });
});

const closeLightbox = () => {
  if (!lightbox || !lightboxImage) return;
  lightbox.hidden = true;
  lightboxImage.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
  lightboxImage.alt = "";
};

if (lightbox && lightboxClose) {
  lightboxClose.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeLightbox();
  });
}

const selectedServices = () => [...serviceOptions].filter((item) => item.checked).map((item) => item.value);

const updateServicesSummary = () => {
  if (!servicesSummary) return;
  const selected = selectedServices();
  servicesSummary.textContent = selected.length ? selected.join(", ") : "Select services";
};

if (serviceOptions.length) {
  serviceOptions.forEach((option) => option.addEventListener("change", updateServicesSummary));
  updateServicesSummary();
}

if (inquiryForm) {
  inquiryForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const data = new FormData(inquiryForm);
    const services = selectedServices();

    if (!services.length) {
      if (formStatus) formStatus.textContent = "Please select at least one service required.";
      if (servicesSelect) servicesSelect.open = true;
      return;
    }

    const name = data.get("name") || "";
    const subject = encodeURIComponent(`Defined by Dwija inquiry from ${name}`);
    const body = encodeURIComponent(
      [
        "Contact Information",
        `Full Name: ${name}`,
        `Email Address: ${data.get("email") || ""}`,
        `Phone Number: ${data.get("phone") || ""}`,
        "",
        "Event Details",
        `Event Type: ${data.get("eventType") || ""}`,
        `Event Date: ${data.get("date") || ""}`,
        `Time Needed To Be Ready By: ${data.get("readyTime") || ""}`,
        `Location / Getting Ready Location: ${data.get("location") || ""}`,
        "",
        "Services",
        `Services Required: ${services.join(", ")}`,
        `Number of People Requiring Services: ${data.get("party") || ""}`,
        `Trial Needed: ${data.get("trialNeeded") || ""}`,
        "",
        "Additional Information",
        `How Did You Hear About Me: ${data.get("heardFrom") || ""}`,
        "",
        "Additional Notes / Inspiration Details:",
        data.get("notes") || "",
      ].join("\n")
    );

    window.location.href = `mailto:hello@definedbydwija.com?subject=${subject}&body=${body}`;
    if (formStatus) {
      formStatus.textContent =
        "Thank you for reaching out to Defined by Dwija. We'll review your inquiry and get back to you within 24-48 hours.";
    }
  });
}
