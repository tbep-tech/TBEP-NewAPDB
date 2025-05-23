// Configuration for Smartsheet iframes and data
const smartsheetConfig = {
  formUrl: "https://app.smartsheet.com/sheets/YourFormSheetId",
  tableUrl: "https://app.smartsheet.com/sheets/YourTableSheetId",
  apiUrl: "https://api.smartsheet.com/2.0",
  landUseSheetId: "3365837005082500",
  treatmentMethodSheetId: "7586918783995780",
  apiKey: "YOUR_API_KEY", // Replace this with your actual API key
};

// Initialize Smartsheet iframes
function initializeSmartsheetIframes() {
  const formContainer = document.getElementById("smartsheet-form");
  const tableContainer = document.getElementById("smartsheet-table");

  // Create and insert form iframe
  const formIframe = document.createElement("iframe");
  formIframe.src = smartsheetConfig.formUrl;
  formIframe.title = "Smartsheet Form";
  formContainer.innerHTML = "";
  formContainer.appendChild(formIframe);

  // Create and insert table iframe
  const tableIframe = document.createElement("iframe");
  tableIframe.src = smartsheetConfig.tableUrl;
  tableIframe.title = "Smartsheet Table View";
  tableContainer.innerHTML = "";
  tableContainer.appendChild(tableIframe);
}

// TN Calculator functionality
class TNCalculator {
  constructor() {
    // Initialize NPS calculator elements
    this.npsForm = document.getElementById("nps-calculator-form");
    this.npsResult = document.getElementById("nps-calculator-result");
    this.npsLandUseSelect = document.getElementById("npsLandUse");
    this.npsTreatmentMethodSelect =
      document.getElementById("npsTreatmentMethod");
    this.npsTreatmentArea = document.getElementById("npsTreatmentArea");

    // Initialize PS calculator elements
    this.psForm = document.getElementById("ps-calculator-form");
    this.psResult = document.getElementById("ps-calculator-result");

    // Track active form section for keyboard navigation
    this.activeFormSection = "nps";

    // Initialize focus management
    this.initializeFocusManagement();

    this.initializeEventListeners();
    this.initializeValidationListeners();
    this.loadData();
  }

  initializeEventListeners() {
    // NPS Calculator event listeners
    this.npsForm.addEventListener("submit", (e) => {
      console.log("NPS form submitted");
      e.preventDefault();
      if (this.validateForm(this.npsForm)) {
        console.log("Form validation passed");
        this.calculateNPS();
      } else {
        console.log("Form validation failed");
      }
    });

    // PS Calculator event listeners
    this.psForm.addEventListener("submit", (e) => {
      console.log("PS form submitted");
      e.preventDefault();
      if (this.validateForm(this.psForm)) {
        console.log("PS form validation passed");
        this.calculatePS();
      } else {
        console.log("PS form validation failed");
      }
    });

    // Add validation for percentage inputs
    const psAttenuationFactor = document.getElementById("psAttenuationFactor");

    psAttenuationFactor.addEventListener("input", () => {
      this.validatePercentageInput(psAttenuationFactor);
    });

    // Add keyboard navigation for calculator tabs
    const tabList = document.getElementById("calculatorTabs");
    const tabs = tabList.querySelectorAll('[role="tab"]');

    // Initialize tab panel navigation
    const returnToTabsButtons = document.querySelectorAll(
      ".calculator-return-to-tabs"
    );
    returnToTabsButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const activeTab = document.querySelector(
          '[role="tab"][aria-selected="true"]'
        );
        if (activeTab) {
          activeTab.focus();
        }
      });
    });

    // Handle iframe escape
    const iframeEscapeButtons = document.querySelectorAll(".iframe-escape");
    iframeEscapeButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const section = button.closest("section");
        if (section) {
          const sectionHeading = section.querySelector("h2");
          if (sectionHeading) {
            sectionHeading.focus();
          }
        }
      });
    });

    // Ensure proper tab indexing
    function updateTabIndexes() {
      tabs.forEach((tab) => {
        tab.setAttribute(
          "tabindex",
          tab.getAttribute("aria-selected") === "true" ? "0" : "-1"
        );
      });
    }

    // Update tab indexes on tab change
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        setTimeout(updateTabIndexes, 100);
      });
    });

    tabList.addEventListener("keydown", (e) => {
      const targetTab = e.target.closest('[role="tab"]');
      if (!targetTab) return;

      let newTab = null;

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          newTab =
            targetTab.previousElementSibling?.querySelector('[role="tab"]') ||
            tabs[tabs.length - 1];
          break;
        case "ArrowRight":
          e.preventDefault();
          newTab =
            targetTab.nextElementSibling?.querySelector('[role="tab"]') ||
            tabs[0];
          break;
        case "Home":
          e.preventDefault();
          newTab = tabs[0];
          break;
        case "End":
          e.preventDefault();
          newTab = tabs[tabs.length - 1];
          break;
      }

      if (newTab) {
        tabs.forEach((tab) => {
          tab.setAttribute("aria-selected", "false");
          tab.setAttribute("tabindex", "-1");
        });
        newTab.setAttribute("aria-selected", "true");
        newTab.setAttribute("tabindex", "0");
        newTab.focus();
        newTab.click();
      }
    });
  }

  initializeFocusManagement() {
    // Handle tab switching focus management
    const npsTab = document.getElementById("nps-tab");
    const psTab = document.getElementById("ps-tab");
    const npsForm = document.getElementById("nps");
    const psForm = document.getElementById("ps");

    npsTab.addEventListener("click", () => {
      this.activeFormSection = "nps";
      // Clear PS calculator results
      this.psResult.innerHTML = "";
      // Focus first input in NPS form
      setTimeout(() => {
        const firstInput = npsForm.querySelector(
          'input, select, button:not([aria-hidden="true"])'
        );
        if (firstInput) firstInput.focus();
      }, 100);
    });

    psTab.addEventListener("click", () => {
      this.activeFormSection = "ps";
      // Clear NPS calculator results
      this.npsResult.innerHTML = "";
      // Focus first input in PS form
      setTimeout(() => {
        const firstInput = psForm.querySelector(
          'input, select, button:not([aria-hidden="true"])'
        );
        if (firstInput) firstInput.focus();
      }, 100);
    });

    // Handle form submission focus management
    this.npsForm.addEventListener("submit", () => {
      setTimeout(() => {
        const result = document.getElementById("nps-calculator-result");
        if (result) {
          const copyButton = result.querySelector(".copy-value");
          if (copyButton) copyButton.focus();
        }
      }, 100);
    });

    this.psForm.addEventListener("submit", () => {
      setTimeout(() => {
        const result = document.getElementById("ps-calculator-result");
        if (result) {
          const copyButton = result.querySelector(".copy-value");
          if (copyButton) copyButton.focus();
        }
      }, 100);
    });
  }

  initializeValidationListeners() {
    // Add input listeners to all form controls to clear validation state on change
    const addInputListener = (element) => {
      element.addEventListener("input", () => {
        element.classList.remove("is-invalid");
        element.setCustomValidity("");
        const feedbackDiv =
          element.parentElement.querySelector(".invalid-feedback");
        if (feedbackDiv) {
          feedbackDiv.remove();
        }
      });
    };

    // Add listeners to NPS form controls
    [this.npsTreatmentArea].forEach(addInputListener);
    this.npsLandUseSelect.addEventListener("change", () => {
      this.npsLandUseSelect.classList.remove("is-invalid");
      this.npsLandUseSelect.setCustomValidity("");
      const feedbackDiv =
        this.npsLandUseSelect.parentElement.querySelector(".invalid-feedback");
      if (feedbackDiv) {
        feedbackDiv.remove();
      }
    });
    this.npsTreatmentMethodSelect.addEventListener("change", () => {
      this.npsTreatmentMethodSelect.classList.remove("is-invalid");
      this.npsTreatmentMethodSelect.setCustomValidity("");
      const feedbackDiv =
        this.npsTreatmentMethodSelect.parentElement.querySelector(
          ".invalid-feedback"
        );
      if (feedbackDiv) {
        feedbackDiv.remove();
      }
    });

    // Add listeners to PS form controls
    const psControls = [
      document.getElementById("psAvgDischarge"),
      document.getElementById("psTNConcentration"),
      document.getElementById("psAttenuationFactor"),
    ];
    psControls.forEach(addInputListener);
  }

  validatePercentageInput(input) {
    const value = parseFloat(input.value);
    if (isNaN(value) || value < 0 || value > 100) {
      input.setCustomValidity("Please enter a value between 0 and 100");
      return false;
    }
    input.setCustomValidity("");
    return true;
  }

  validateForm(form) {
    console.log("Validating form");
    let isValid = true;

    // Check required fields
    const requiredFields = form.querySelectorAll("[required]");
    requiredFields.forEach((field) => {
      if (!field.value.trim()) {
        console.log(`Required field empty: ${field.id}`);
        field.classList.add("is-invalid");

        // Create and add invalid feedback message
        const feedbackDiv = document.createElement("div");
        feedbackDiv.className = "invalid-feedback";
        feedbackDiv.textContent = "This field is required";
        field.parentElement.appendChild(feedbackDiv);

        field.setCustomValidity("This field is required");
        isValid = false;
      } else {
        field.classList.remove("is-invalid");
        field.setCustomValidity("");
      }
    });

    // Validate percentage inputs
    const percentageInputs = form.querySelectorAll("input[max='100']");
    percentageInputs.forEach((input) => {
      const container = input.closest(".form-group, .mb-3");
      if (container?.style.display === "none") {
        return;
      }

      const value = parseFloat(input.value);
      if (!isNaN(value) && (value < 0 || value > 100)) {
        console.log(`Invalid percentage value in: ${input.id}`);
        input.classList.add("is-invalid");

        // Create and add invalid feedback message
        const feedbackDiv = document.createElement("div");
        feedbackDiv.className = "invalid-feedback";
        feedbackDiv.textContent = "Please enter a value between 0 and 100";
        input.parentElement.appendChild(feedbackDiv);

        input.setCustomValidity("Please enter a value between 0 and 100");
        isValid = false;
      } else {
        input.classList.remove("is-invalid");
        input.setCustomValidity("");
      }
    });

    if (!isValid) {
      // Trigger the browser's native form validation UI
      form.reportValidity();
    }

    console.log(`Form validation result: ${isValid}`);
    return isValid;
  }

  async loadData() {
    try {
      // Load land use data from JSON file
      const landUseResponse = await fetch(
        "calculator/tn_calculator_land_use.json"
      );
      const landUseData = await landUseResponse.json();
      this.populateLandUseSelect(landUseData);
      this.landUseData = landUseData;

      // Load treatment method data from JSON file
      const treatmentResponse = await fetch(
        "calculator/tn_calculator_treatment_methods.json"
      );
      const treatmentData = await treatmentResponse.json();
      this.populateTreatmentMethodSelect(treatmentData);
      this.treatmentMethodData = treatmentData;
    } catch (error) {
      console.error("Error loading data:", error);
      this.showError("Failed to load options. Please try again later.");
    }
  }

  populateLandUseSelect(landUseData) {
    // Clear existing options except the first one
    while (this.npsLandUseSelect.options.length > 1) {
      this.npsLandUseSelect.remove(1);
    }

    // Add new options
    landUseData.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.name;
      option.textContent = item.name;
      option.dataset.baseLoad = item.base_load;
      this.npsLandUseSelect.appendChild(option);
    });
  }

  populateTreatmentMethodSelect(treatmentData) {
    // Clear existing options except the first one
    while (this.npsTreatmentMethodSelect.options.length > 1) {
      this.npsTreatmentMethodSelect.remove(1);
    }

    // Add new options
    treatmentData.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.name;
      option.textContent = item.name;
      option.dataset.removalRate = item.removal_rate;
      this.npsTreatmentMethodSelect.appendChild(option);
    });
  }

  getBaseLoadForLandUse(landUse) {
    const landUseData = this.landUseData.find((item) => item.name === landUse);
    return landUseData ? landUseData.base_load : 0;
  }

  getDefaultRemovalRate(treatmentMethod) {
    const treatmentData = this.treatmentMethodData.find(
      (item) => item.name === treatmentMethod
    );
    return treatmentData ? treatmentData.removal_rate : 0;
  }

  showError(message) {
    const errorDiv = document.createElement("div");
    errorDiv.className = "alert alert-danger";
    errorDiv.textContent = message;
    this.npsForm.insertBefore(errorDiv, this.npsForm.firstChild);
  }

  calculateNPS() {
    try {
      const landUse = this.npsLandUseSelect.value;
      const treatmentMethod = this.npsTreatmentMethodSelect.value;
      const treatmentArea = parseFloat(this.npsTreatmentArea.value);

      // Get base load and removal rate
      const baseLoad = this.getBaseLoadForLandUse(landUse);
      const removalRate = this.getDefaultRemovalRate(treatmentMethod);

      // Calculate TN load reduction
      const tnLoadReduction = baseLoad * treatmentArea * removalRate;

      this.displayNPSResult(tnLoadReduction, treatmentMethod);
    } catch (error) {
      console.error("Error calculating NPS:", error);
      this.showError("Error calculating NPS TN load reduction");
    }
  }

  calculatePS() {
    try {
      const discharge = parseFloat(
        document.getElementById("psAvgDischarge").value
      );
      const concentration = parseFloat(
        document.getElementById("psTNConcentration").value
      );
      const attenuationFactor =
        parseFloat(document.getElementById("psAttenuationFactor").value) / 100;

      // Calculate TN load reduction
      const tnLoadReduction =
        1.524 * (discharge * concentration * attenuationFactor);

      this.displayPSResult(tnLoadReduction);
    } catch (error) {
      console.error("Error calculating PS:", error);
      this.showError("Error calculating PS TN load reduction");
    }
  }

  displayNPSResult(tnLoadReduction, treatmentMethod) {
    const resultElement = this.npsResult;
    resultElement.innerHTML = `
      <div class="calculator-result-container">
        <div class="result-content">
          <h4>${tnLoadReduction.toFixed(2)} lbs/year</h4>
          <p>NPS TN Load Reduction</p>
        </div>
        <button type="button" class="copy-value" data-value="${tnLoadReduction.toFixed(
          2
        )}">
          Copy Value
        </button>
      </div>
    `;
    this.initializeCopyButtons();
  }

  displayPSResult(tnLoadReduction) {
    const resultElement = this.psResult;
    resultElement.innerHTML = `
      <div class="calculator-result-container">
        <div class="result-content">
          <h4>${tnLoadReduction.toFixed(2)} lbs/year</h4>
          <p>PS TN Load Reduction</p>
        </div>
        <button type="button" class="copy-value" data-value="${tnLoadReduction.toFixed(
          2
        )}">
          Copy Value
        </button>
      </div>
    `;
    this.initializeCopyButtons();
  }

  initializeCopyButtons() {
    const copyButtons = document.querySelectorAll(".copy-value");
    copyButtons.forEach((button) => {
      button.addEventListener("click", async () => {
        const value = button.getAttribute("data-value");
        try {
          // Try using the Clipboard API first
          await navigator.clipboard.writeText(value);
          this.showCopySuccess(button);
        } catch (err) {
          console.log("Clipboard API failed, trying fallback method");
          // Fallback method using a temporary textarea
          const textarea = document.createElement("textarea");
          textarea.value = value;
          textarea.style.position = "fixed";
          textarea.style.opacity = "0";
          document.body.appendChild(textarea);
          textarea.select();
          try {
            document.execCommand("copy");
            this.showCopySuccess(button);
          } catch (fallbackErr) {
            console.error("Fallback copy failed:", fallbackErr);
            alert(
              "Failed to copy value. Please try selecting and copying manually."
            );
          }
          document.body.removeChild(textarea);
        }
      });
    });
  }

  showCopySuccess(button) {
    const originalText = button.textContent;
    button.textContent = "Copied!";
    button.classList.add("active");

    // Remove active state and restore original text after 2000ms
    setTimeout(() => {
      button.classList.remove("active");
      button.textContent = originalText;
    }, 2000);
  }
}

// Initialize everything when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Prevent automatic scrolling
  if (window.location.hash) {
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 1);
  }

  // Initialize TN Calculator
  const calculator = new TNCalculator();

  // Handle iframe loading
  document.querySelectorAll(".iframe-container iframe").forEach((iframe) => {
    // Show skeleton loader initially
    const container = iframe.closest(".iframe-container");

    iframe.addEventListener("load", () => {
      // Hide skeleton and show iframe
      container.classList.add("loaded");
      iframe.classList.add("loaded");

      // Update ARIA attributes
      const loader = container.querySelector(".skeleton-loader");
      if (loader) {
        loader.setAttribute("aria-hidden", "true");
      }
      iframe.removeAttribute("aria-hidden");

      // Set initial height based on content
      if (container.classList.contains("reports-container")) {
        container.style.minHeight = "700px";
        iframe.style.height = "100%";
      } else {
        const formHeight = iframe.contentWindow.document.body.scrollHeight;
        container.style.minHeight = `${Math.max(1500, formHeight)}px`;
        iframe.style.height = "100%";
      }
    });

    // Set initial ARIA states
    iframe.removeAttribute("aria-hidden");
  });

  // Adjust iframe heights on window resize
  window.addEventListener("resize", () => {
    document
      .querySelectorAll(".iframe-container iframe.loaded")
      .forEach((iframe) => {
        const container = iframe.closest(".iframe-container");
        const formHeight = iframe.contentWindow.document.body.scrollHeight;
        container.style.minHeight = `${Math.max(1500, formHeight)}px`;
        iframe.style.height = "100%";
      });
  });

  // Hamburger Menu Functionality
  const hamburger = document.querySelector(".hamburger-menu");
  const navLinks = document.querySelector(".nav-links");
  const navLinksItems = document.querySelectorAll(".nav-link");
  const closeButton = document.querySelector(".close-menu");

  function toggleMenu() {
    hamburger.classList.toggle("active");
    navLinks.classList.toggle("active");
    const isExpanded = hamburger.getAttribute("aria-expanded") === "true";
    hamburger.setAttribute("aria-expanded", !isExpanded);
  }

  hamburger.addEventListener("click", toggleMenu);
  closeButton.addEventListener("click", toggleMenu);

  // Close menu when clicking a link
  navLinksItems.forEach((link) => {
    link.addEventListener("click", () => {
      if (navLinks.classList.contains("active")) {
        toggleMenu();
      }
    });
  });

  // Close menu when clicking outside
  document.addEventListener("click", (e) => {
    if (
      navLinks.classList.contains("active") &&
      !navLinks.contains(e.target) &&
      !hamburger.contains(e.target)
    ) {
      toggleMenu();
    }
  });

  // Close menu on escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && navLinks.classList.contains("active")) {
      toggleMenu();
    }
  });
});
