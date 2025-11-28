/**
 * BACK IN STOCK - AJAX Form Handler
 * Submits to Shopify customer endpoint without page redirect
 */

// @ts-nocheck
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBackInStock);
} else {
  initBackInStock();
}

function initBackInStock() {
  const forms = document.querySelectorAll('[data-bis-ajax-form]');
  
  forms.forEach(form => {
    const wrapper = form.closest('[data-product-handle]');
    if (!wrapper) return;
    
    const productHandle = wrapper.dataset.productHandle;
    
    // Check localStorage for previous signup
    checkPreviousSignup(form, productHandle);
    
    // Handle form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleFormSubmit(form, productHandle);
    });
  });
}

/**
 * Check if user already signed up
 */
function checkPreviousSignup(form, productHandle) {
  const storageKey = `bis_${productHandle}`;
  const previousEmail = localStorage.getItem(storageKey);
  
  if (previousEmail) {
    showSuccess(form);
  }
}

/**
 * Handle AJAX form submission
 */
async function handleFormSubmit(form, productHandle) {
  const submitBtn = form.querySelector('[data-bis-submit]');
  const errorDiv = form.querySelector('[data-bis-error]');
  const emailInput = form.querySelector('input[type="email"]');
  const email = emailInput.value.trim().toLowerCase();
  
  // Show loading state
  submitBtn.disabled = true;
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Submitting...';
  hideError(errorDiv);
  
  try {
    // Submit form data
    const formData = new FormData(form);
    
    const response = await fetch('/contact', {
      method: 'POST',
      body: formData
    });
    
    if (response.ok || response.redirected) {
      // Save to localStorage
      const storageKey = `bis_${productHandle}`;
      localStorage.setItem(storageKey, email);
      
      // Show success
      showSuccess(form);
    } else {
      throw new Error('Submission failed');
    }
    
  } catch (error) {
    console.error('Submission error:', error);
    showError(errorDiv, 'Something went wrong. Please try again.');
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

/**
 * Show success message
 */
function showSuccess(form) {
  const formContainer = form.querySelector('[data-bis-form-container]');
  const successDiv = form.querySelector('[data-bis-success]');
  
  if (formContainer) formContainer.style.display = 'none';
  if (successDiv) successDiv.style.display = 'block';
}

/**
 * Show error message
 */
function showError(errorDiv, message) {
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
  }
}

/**
 * Hide error message
 */
function hideError(errorDiv) {
  if (errorDiv) {
    errorDiv.style.display = 'none';
  }
}
