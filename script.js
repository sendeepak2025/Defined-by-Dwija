// Global Interactions for Defined by Dwija

document.addEventListener("DOMContentLoaded", () => {
  // 1. Fixed Header on Scroll
  const header = document.querySelector("[data-header]");
  const updateHeader = () => {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 24);
  };
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  // 2. Navigation Mobile Menu Toggle
  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".primary-nav");
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

  // 3. Scroll Reveal Animations (Intersection Observer)
  const revealElements = document.querySelectorAll(".reveal");
  if (revealElements.length) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target); // reveal once
          }
        });
      },
      // threshold:0 with negative rootMargin: fires when the element edges
      // 80px into the viewport. Works for tall sections (like portfolio gallery)
      // whose total height exceeds the viewport on mobile.
      { threshold: 0, rootMargin: "0px 0px -80px 0px" }
    );
    revealElements.forEach((el) => revealObserver.observe(el));
  }

  // 4. Portfolio Gallery, Filters & Animations
  const renderPortfolioGallery = () => {
    const gallery = document.querySelector("[data-portfolio-gallery]");
    if (!gallery || !Array.isArray(window.portfolioItems)) return;

    const escapeHTML = (value) =>
      String(value ?? "").replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[char]));

    gallery.innerHTML = window.portfolioItems.map((item) => {
      const layout = item.layout ? ` ${escapeHTML(item.layout)}` : "";
      const title = escapeHTML(item.title);
      const label = escapeHTML(item.label);
      const alt = escapeHTML(item.alt || item.title);
      const src = escapeHTML(item.src);
      const category = escapeHTML(item.category);

      return `<figure class="portfolio-card${layout}" data-category="${category}"><button type="button" data-lightbox aria-label="View larger image: ${title}"><img src="${src}" alt="${alt}" loading="lazy" decoding="async" /></button><figcaption><span>${label}</span><strong>${title}</strong></figcaption></figure>`;
    }).join("");
  };

  renderPortfolioGallery();

  const filterButtons = document.querySelectorAll("[data-filter]");
  const getPortfolioItems = () => Array.from(document.querySelectorAll("[data-portfolio-gallery] .portfolio-card"));
  const setPortfolioFilter = (filter) => {
    const activeFilter = filter || "all";
    filterButtons.forEach((item) => {
      const isActive = item.dataset.filter === activeFilter;
      item.classList.toggle("active", isActive);
      item.setAttribute("aria-pressed", String(isActive));
    });

    getPortfolioItems().forEach((item) => {
      const categories = String(item.dataset.category || "").split(/\s+/).filter(Boolean);
      const matches = activeFilter === "all" || categories.includes(activeFilter);
      item.hidden = !matches;
      item.classList.toggle("hidden", !matches);

      if (matches) {
        item.style.opacity = "0";
        item.style.transform = "scale(0.96)";
        window.setTimeout(() => {
          item.style.transition = "opacity 400ms ease, transform 400ms ease";
          item.style.opacity = "1";
          item.style.transform = "scale(1)";
        }, 30);
      } else {
        item.style.transition = "";
        item.style.opacity = "";
        item.style.transform = "";
      }
    });
  };

  if (filterButtons.length && getPortfolioItems().length) {
    const params = new URLSearchParams(window.location.search);
    const initialFilter = params.get("filter") || "all";
    const validFilter = [...filterButtons].some((button) => button.dataset.filter === initialFilter) ? initialFilter : "all";
    setPortfolioFilter(validFilter);

    filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        setPortfolioFilter(button.dataset.filter || "all");
        if (button.closest(".portfolio-category-grid")) {
          document.querySelector("#portfolio-gallery")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });
  }

  // 5. Accordion for Services (Generic toggle)
  document.querySelectorAll(".accordion-trigger").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const panel = trigger.closest(".service-panel");
      if (!panel) return;
      const isOpening = !panel.classList.contains("open");

      if (panel.classList.contains("pricing-panel")) {
        document.querySelectorAll(".pricing-panel.open").forEach((openPanel) => {
          if (openPanel === panel) return;
          openPanel.classList.remove("open");
          const openTrigger = openPanel.querySelector(".accordion-trigger");
          openTrigger?.setAttribute("aria-expanded", "false");
          const symbol = openTrigger?.querySelector("span");
          if (symbol) symbol.textContent = "+";
        });
      }

      panel.classList.toggle("open", isOpening);
      trigger.setAttribute("aria-expanded", String(isOpening));
      const symbol = trigger.querySelector("span");
      if (symbol) symbol.textContent = isOpening ? "-" : "+";
    });
  });

  const openServicePanelFromHash = () => {
    const target = window.location.hash ? document.querySelector(window.location.hash) : null;
    if (!target?.classList.contains("pricing-panel")) return;
    const trigger = target.querySelector(".accordion-trigger");
    if (!target.classList.contains("open")) trigger?.click();
  };
  openServicePanelFromHash();
  window.addEventListener("hashchange", openServicePanelFromHash);

  // 6. Interactive FAQ Accordion
  const faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach((item) => {
    const trigger = item.querySelector(".faq-trigger");
    const panel = item.querySelector(".faq-panel");
    if (trigger && panel) {
      trigger.addEventListener("click", () => {
        const isOpen = item.classList.toggle("open");
        trigger.setAttribute("aria-expanded", String(isOpen));
        if (isOpen) {
          panel.style.maxHeight = panel.scrollHeight + "px";
          // Close other FAQs
          faqItems.forEach((otherItem) => {
            if (otherItem !== item && otherItem.classList.contains("open")) {
              otherItem.classList.remove("open");
              otherItem.querySelector(".faq-trigger")?.setAttribute("aria-expanded", "false");
              otherItem.querySelector(".faq-panel").style.maxHeight = null;
            }
          });
        } else {
          panel.style.maxHeight = null;
        }
      });
    }
  });

  // 7. Lightbox Modal
  const lightbox = document.querySelector("[data-lightbox-modal]");
  const lightboxImage = document.querySelector("[data-lightbox-image]");
  const lightboxClose = document.querySelector("[data-lightbox-close]");

  const closeLightbox = () => {
    if (!lightbox || !lightboxImage) return;
    lightbox.hidden = true;
    lightboxImage.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
    lightboxImage.alt = "";
  };

  document.querySelectorAll("[data-lightbox]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!lightbox || !lightboxImage) return;
      const image = button.querySelector("img");
      lightboxImage.src = image.src;
      lightboxImage.alt = image.alt;
      lightbox.hidden = false;
    });
  });

  if (lightbox && lightboxClose) {
    lightboxClose.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) closeLightbox();
    });
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeLightbox();
    });
  }

  // 8. Testimonials Slider (Carousel)
  const slider = document.querySelector(".testimonials-slider");
  const slides = document.querySelectorAll(".testimonial-slide-wrap");
  const prevBtn = document.querySelector(".slider-arrow-prev");
  const nextBtn = document.querySelector(".slider-arrow-next");
  const dotsContainer = document.querySelector(".slider-dots");

  if (slider && slides.length) {
    let currentSlide = 0;

    // Generate dots
    slides.forEach((_, index) => {
      const dot = document.createElement("button");
      dot.classList.add("slider-dot");
      if (index === 0) dot.classList.add("active");
      dot.setAttribute("type", "button");
      dot.setAttribute("aria-label", `Go to slide ${index + 1}`);
      dotsContainer?.appendChild(dot);

      dot.addEventListener("click", () => {
        goToSlide(index);
      });
    });

    const dots = document.querySelectorAll(".slider-dot");
    const currentLabel = document.querySelector("[data-slider-current]");
    const totalLabel = document.querySelector("[data-slider-total]");
    if (totalLabel) totalLabel.textContent = String(slides.length).padStart(2, "0");

    const updateDots = () => {
      dots.forEach((dot, index) => dot.classList.toggle("active", index === currentSlide));
      if (currentLabel) currentLabel.textContent = String(currentSlide + 1).padStart(2, "0");
    };

    const goToSlide = (index) => {
      currentSlide = (index + slides.length) % slides.length;
      slider.style.transform = `translateX(-${currentSlide * 100}%)`;
      updateDots();
    };

    prevBtn?.addEventListener("click", () => goToSlide(currentSlide - 1));
    nextBtn?.addEventListener("click", () => goToSlide(currentSlide + 1));

    // Auto-rotation every 7 seconds
    let slideInterval = setInterval(() => goToSlide(currentSlide + 1), 7000);
    const resetTimer = () => {
      clearInterval(slideInterval);
      slideInterval = setInterval(() => goToSlide(currentSlide + 1), 7000);
    };

    prevBtn?.addEventListener("click", resetTimer);
    nextBtn?.addEventListener("click", resetTimer);
    dots.forEach((dot) => dot.addEventListener("click", resetTimer));
  }

  // 9. Interactive Package Customizer (Calculator on services.html)
  const customizer = document.querySelector("[data-package-customizer]");
  if (customizer) {
    const radioInputs = customizer.querySelectorAll('input[name="base-pkg"]');
    const addonCheckboxes = customizer.querySelectorAll('.customizer-addon-check');
    const bridalCards = customizer.querySelectorAll(".customizer-card");
    const countInputs = customizer.querySelectorAll("[data-counter-input]");

    // Counter buttons logic
    customizer.querySelectorAll(".counter-widget").forEach((widget) => {
      const input = widget.querySelector("[data-counter-input]");
      const decBtn = widget.querySelector(".counter-dec");
      const incBtn = widget.querySelector(".counter-inc");

      if (input && decBtn && incBtn) {
        decBtn.addEventListener("click", () => {
          let val = parseInt(input.value) || 0;
          if (val > 0) {
            input.value = val - 1;
            calculateEstimate();
          }
        });
        incBtn.addEventListener("click", () => {
          let val = parseInt(input.value) || 0;
          input.value = val + 1;
          calculateEstimate();
        });
        input.addEventListener("change", () => {
          let val = parseInt(input.value) || 0;
          if (val < 0) input.value = 0;
          calculateEstimate();
        });
      }
    });

    const calculateEstimate = () => {
      let totalPrice = 0;
      let selectedBaseText = "";
      let selectedBasePrice = 0;
      let detailsHTML = "";
      let servicesList = [];

      // Update card visual checked states & get base package
      bridalCards.forEach((card) => {
        const input = card.querySelector('input[type="radio"], input[type="checkbox"]');
        if (input) {
          const isChecked = input.checked;
          card.classList.toggle("checked", isChecked);
          if (isChecked && input.name === "base-pkg") {
            selectedBasePrice = parseInt(input.dataset.price) || 0;
            selectedBaseText = input.value;
            totalPrice += selectedBasePrice;
            servicesList.push(input.dataset.serviceName || input.value);
          }
        }
      });

      // Add Base Package to summary
      detailsHTML += `<div class="summary-item"><span>${selectedBaseText}</span><span>$${selectedBasePrice}</span></div>`;

      // Calculate checked addons
      addonCheckboxes.forEach((checkbox) => {
        const parentCard = checkbox.closest(".customizer-card");
        const isChecked = checkbox.checked;
        parentCard?.classList.toggle("checked", isChecked);

        if (isChecked) {
          const price = parseInt(checkbox.dataset.price) || 0;
          totalPrice += price;
          detailsHTML += `<div class="summary-item"><span>+ ${checkbox.value}</span><span>$${price}</span></div>`;
          servicesList.push(checkbox.dataset.serviceName || checkbox.value);
        }
      });

      // Calculate party pricing
      countInputs.forEach((input) => {
        const count = parseInt(input.value) || 0;
        if (count > 0) {
          const itemPrice = parseInt(input.dataset.price) || 0;
          const subtotal = count * itemPrice;
          totalPrice += subtotal;
          detailsHTML += `<div class="summary-item"><span>+ ${count}x ${input.dataset.label}</span><span>$${subtotal}</span></div>`;
          servicesList.push(input.dataset.serviceName || input.dataset.label);
        }
      });

      // Render items
      const summaryItemsContainer = customizer.querySelector("[data-summary-items]");
      const summaryTotalValue = customizer.querySelector("[data-summary-total-val]");
      if (summaryItemsContainer) summaryItemsContainer.innerHTML = detailsHTML;
      if (summaryTotalValue) summaryTotalValue.textContent = `$${totalPrice}`;

      // Package Data to save
      const packageEstimate = {
        baseName: selectedBaseText,
        basePrice: selectedBasePrice,
        totalPrice: totalPrice,
        servicesList: servicesList,
        partySummary: getPartySummaryText(),
        addonsList: getSelectedAddonsText(),
      };

      const inquireBtn = customizer.querySelector("[data-inquire-package-btn]");
      if (inquireBtn) {
        inquireBtn.onclick = (e) => {
          e.preventDefault();
          sessionStorage.setItem("dwija_custom_package", JSON.stringify(packageEstimate));
          window.location.href = "inquiry.html";
        };
      }
    };

    const getPartySummaryText = () => {
      let partyArr = [];
      countInputs.forEach((input) => {
        const count = parseInt(input.value) || 0;
        if (count > 0) {
          partyArr.push(`${count} ${input.dataset.label}`);
        }
      });
      return partyArr.length ? partyArr.join(", ") : "";
    };

    const getSelectedAddonsText = () => {
      let addonsArr = [];
      addonCheckboxes.forEach((checkbox) => {
        if (checkbox.checked) {
          addonsArr.push(checkbox.value);
        }
      });
      return addonsArr;
    };

    // Attach change event listeners
    radioInputs.forEach((radio) => radio.addEventListener("change", calculateEstimate));
    addonCheckboxes.forEach((checkbox) => checkbox.addEventListener("change", calculateEstimate));

    // Initialize estimate
    calculateEstimate();
  }

  // 10. Inquiry Form Pre-population & Step Logic
  const inquiryForm = document.querySelector("[data-inquiry-form]");
  const serviceOptions = document.querySelectorAll("[data-service-option]");
  const servicesSummary = document.querySelector("[data-services-summary]");
  const servicesSelect = document.querySelector("[data-services-select]");

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

  // Check for stored estimator selection from services.html
  if (inquiryForm) {
    const cachedPackage = sessionStorage.getItem("dwija_custom_package");
    if (cachedPackage) {
      try {
        const data = JSON.parse(cachedPackage);

        // Pre-check corresponding checkboxes
        if (data.servicesList && data.servicesList.length) {
          serviceOptions.forEach((chk) => {
            const val = chk.value.toLowerCase();
            const shouldCheck = data.servicesList.some((s) => {
              const serviceLower = s.toLowerCase();
              return serviceLower.includes(val) || val.includes(serviceLower);
            });
            if (shouldCheck) chk.checked = true;
          });
          updateServicesSummary();
        }

        // Set Party size details
        const partyInput = inquiryForm.querySelector('input[name="party"]');
        if (partyInput) {
          partyInput.value = data.partySummary ? `Bride + ${data.partySummary}` : "Bride Only";
        }

        // Set trial radio based on package chosen
        const trialRadios = inquiryForm.querySelectorAll('input[name="trialNeeded"]');
        if (trialRadios.length) {
          if (data.baseName.includes("Trial") || data.baseName.includes("South Asian")) {
            trialRadios.forEach((r) => {
              if (r.value === "Yes") r.checked = true;
            });
          }
        }

        // Pre-fill notes field with estimate summary
        const notesArea = inquiryForm.querySelector('textarea[name="notes"]');
        if (notesArea) {
          let summaryDetails = `Estimated Custom Package Details:\n`;
          summaryDetails += `- Base Package: ${data.baseName} ($${data.basePrice})\n`;
          if (data.addonsList && data.addonsList.length) {
            summaryDetails += `- Addons: ${data.addonsList.join(", ")}\n`;
          }
          if (data.partySummary) {
            summaryDetails += `- Party services for: ${data.partySummary}\n`;
          }
          summaryDetails += `- Estimated Total Cost: $${data.totalPrice}\n`;
          notesArea.value = summaryDetails;
        }

        // Add visual info banner on form
        const banner = document.createElement("div");
        banner.className = "form-intro reveal revealed";
        banner.style.border = "1px solid var(--gold-line)";
        banner.style.padding = "16px";
        banner.style.borderRadius = "8px";
        banner.style.background = "var(--paper)";
        banner.style.marginBottom = "24px";
        banner.style.color = "var(--gold-deep)";
        banner.innerHTML = `<strong style="font-family: var(--serif); font-size: 18px;">Estimator Package Applied</strong><p style="margin: 4px 0 0 0; font-size: 13px;">Your calculated selection has been successfully filled. You can adjust it below before sending.</p>`;
        inquiryForm.prepend(banner);

        // Clear session storage so it doesn't persist forever
        sessionStorage.removeItem("dwija_custom_package");
      } catch (err) {
        console.error("Error applying cached package details", err);
      }
    }

    // 11. Multi-Step Form Logic
    const formSections = inquiryForm.querySelectorAll(".form-section");
    if (formSections.length) {
      inquiryForm.classList.add("inquiry-form-updated");

      // Inject steps header
      const stepsHeader = document.createElement("div");
      stepsHeader.className = "form-steps";
      stepsHeader.innerHTML = `
        <div class="form-progress-bar" data-progress-bar></div>
        <button type="button" class="form-step-dot active" data-step-btn="0"><span>1</span><label>Contact</label></button>
        <button type="button" class="form-step-dot" data-step-btn="1"><span>2</span><label>Details</label></button>
        <button type="button" class="form-step-dot" data-step-btn="2"><span>3</span><label>Services</label></button>
        <button type="button" class="form-step-dot" data-step-btn="3"><span>4</span><label>Notes</label></button>
      `;
      inquiryForm.insertBefore(stepsHeader, inquiryForm.querySelector(".form-intro").nextSibling);

      let currentStep = 0;
      const stepDots = inquiryForm.querySelectorAll(".form-step-dot");
      const progressBar = inquiryForm.querySelector("[data-progress-bar]");

      // Setup sections
      formSections.forEach((sec, idx) => {
        sec.classList.toggle("active", idx === 0);

        // Inject navigation controls inside each section
        const navDiv = document.createElement("div");
        navDiv.className = "form-nav-buttons";

        if (idx === 0) {
          navDiv.innerHTML = `
            <div></div>
            <button type="button" class="button button-dark next-step-btn">Next Step</button>
          `;
        } else if (idx === formSections.length - 1) {
          navDiv.innerHTML = `
            <button type="button" class="button button-ghost prev-step-btn">Back</button>
            <button type="submit" class="button button-dark submit-step-btn">Submit Email Inquiry</button>
          `;
        } else {
          navDiv.innerHTML = `
            <button type="button" class="button button-ghost prev-step-btn">Back</button>
            <button type="button" class="button button-dark next-step-btn">Next Step</button>
          `;
        }
        sec.appendChild(navDiv);
      });

      const updateFormSteps = (targetStep) => {
        // Validate inputs in current step before proceeding forward
        if (targetStep > currentStep) {
          const currentSection = formSections[currentStep];
          const inputs = currentSection.querySelectorAll("input[required], select[required], textarea[required]");
          let isValid = true;

          inputs.forEach((input) => {
            if (!input.checkValidity()) {
              input.reportValidity();
              isValid = false;
            }
          });

          // Custom verification: Services select on Step 2 (which is index 2)
          if (currentStep === 2) {
            const services = selectedServices();
            if (services.length === 0) {
              const status = document.querySelector("[data-form-status]");
              if (status) status.textContent = "Please select at least one service required.";
              if (servicesSelect) servicesSelect.open = true;
              isValid = false;
            } else {
              const status = document.querySelector("[data-form-status]");
              if (status) status.textContent = "";
            }
          }

          if (!isValid) return;
        }

        // Toggle active step class
        formSections[currentStep].classList.remove("active");
        currentStep = targetStep;
        formSections[currentStep].classList.add("active");

        // Update Dots and Bar
        stepDots.forEach((dot, idx) => {
          dot.classList.toggle("active", idx === currentStep);
          dot.classList.toggle("completed", idx < currentStep);
        });

        const progressPercent = (currentStep / (formSections.length - 1)) * 100;
        if (progressBar) progressBar.style.width = `${progressPercent}%`;

        // Smooth scroll back to form top
        inquiryForm.scrollIntoView({ behavior: "smooth", block: "start" });
      };

      // Add Click Listeners for Buttons
      inquiryForm.querySelectorAll(".next-step-btn").forEach((btn) => {
        btn.addEventListener("click", () => updateFormSteps(currentStep + 1));
      });

      inquiryForm.querySelectorAll(".prev-step-btn").forEach((btn) => {
        btn.addEventListener("click", () => updateFormSteps(currentStep - 1));
      });

      stepDots.forEach((dot, index) => {
        dot.addEventListener("click", () => {
          // Allow jump only backwards or to the immediate next step (which will trigger validation)
          if (index < currentStep) {
            updateFormSteps(index);
          } else if (index === currentStep + 1) {
            updateFormSteps(index);
          }
        });
      });
    }

    // 12. Submit handler logic
    inquiryForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const data = new FormData(inquiryForm);
      const services = selectedServices();
      const formStatus = document.querySelector("[data-form-status]");
      const submitButton = inquiryForm.querySelector(".submit-step-btn");

      if (!services.length) {
        if (formStatus) formStatus.textContent = "Please select at least one service required.";
        if (servicesSelect) servicesSelect.open = true;
        return;
      }

      const name = data.get("name") || "";
      const email = data.get("email") || "";
      const phone = data.get("phone") || "";
      const eventType = data.get("eventType") || "";
      const eventDate = data.get("date") || "";
      const readyTime = data.get("readyTime") || "";
      const location = data.get("location") || "";
      const party = data.get("party") || "";
      const trialNeeded = data.get("trialNeeded") || "";
      const heardFrom = data.get("heardFrom") || "";
      const notes = data.get("notes") || "";
      const payload = {
        subject: `Defined by Dwija inquiry from ${name || "website visitor"}`,
        from_name: "Defined by Dwija Website",
        name,
        email,
        phone,
        "Event Date": eventDate,
        "Event Type": eventType,
        "Ready Time": readyTime,
        "Location": location,
        "Services Required": services.join(", "),
        "People Requiring Services": party,
        "Trial Needed": trialNeeded,
        "Heard From": heardFrom || "Not provided",
        "Notes": notes || "No additional notes provided.",
        message: "New Defined by Dwija bridal and event inquiry. See the individual fields above for the complete quote request details.",
      };

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.dataset.originalText = submitButton.textContent;
        submitButton.textContent = "Sending inquiry...";
      }
      if (formStatus) {
        formStatus.textContent = "Sending your inquiry...";
      }

      try {
        const response = await fetch("/api/inquiry", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        });
        const result = await response.json();

        if (!response.ok || !result.success) throw new Error(result.message || "Inquiry could not be sent.");

        if (formStatus) {
          formStatus.innerHTML = `<span style="color: var(--gold-deep); font-weight: 700;">Inquiry sent.</span> Thank you for reaching out to Defined by Dwija. We'll review your details and get back to you within 24-48 hours.`;
        }
        inquiryForm.reset();
        selectedServices().forEach(() => {});
        if (servicesSelect) servicesSelect.querySelector("summary span").textContent = "Select services";
      } catch (error) {
        if (formStatus) {
          formStatus.innerHTML = `We couldn't send the inquiry automatically. Please email <a href="mailto:jayvekariya2003@gmail.com">jayvekariya2003@gmail.com</a> directly.`;
        }
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = submitButton.dataset.originalText || "Submit Email Inquiry";
        }
      }
    });
  }
});
