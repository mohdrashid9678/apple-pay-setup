// 1. Check if PaymentRequest is available and if Apple Pay is supported
if (window.PaymentRequest) {
  // Optionally check specifically for Apple Pay capability
  if (window.ApplePaySession && ApplePaySession.canMakePayments()) {
    document
      .querySelector("apple-pay-button")
      .addEventListener("click", onApplePayClicked);
  } else {
    log("Apple Pay is not available on this device/browser.");
  }
} else {
  log("Payment Request API not supported.");
}

async function onApplePayClicked() {
  const methods = [
    {
      supportedMethods: "https://apple.com/apple-pay",
      data: {
        version: 3,
        merchantIdentifier: "merchant.com.thankiopay", // Verify this matches Apple Portal
        merchantCapabilities: ["supports3DS"],
        supportedNetworks: ["visa", "masterCard", "amex", "discover"],
        countryCode: "US",
      },
    },
  ];

  const details = {
    total: {
      label: "Robonito Store",
      amount: { currency: "USD", value: "10.00" },
    },
  };

  const options = {
    requestPayerName: true,
    requestPayerEmail: true,
  };

  try {
    const request = new PaymentRequest(methods, details, options);

    // DEBUG: Monitor state changes
    log(`Request created with state: ${request.state}`);

    // 1. Merchant Validation
    request.onmerchantvalidation = (event) => {
      log(`Validation triggered for URL: ${event.validationURL}`);

      const sessionPromise = fetch("/validate-merchant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          validationURL: event.validationURL,
          initiativeContext: window.location.hostname, // Important: no protocol/path
        }),
      })
        .then((res) => {
          if (!res.ok)
            throw new Error(`Server validation failed: ${res.statusText}`);
          return res.json();
        })
        .then((session) => {
          log("Merchant Session received from server.");
          return session;
        });

      // Pass the promise to complete validation
      event.complete(sessionPromise);
    };

    // 2. REQUIRED: Avoid timeout errors by handling method/shipping changes
    request.onpaymentmethodchange = (event) => {
      log("Payment method changed, updating sheet...");
      event.updateWith({});
    };

    // 3. Authorization
    const response = await request.show();
    log("User authorized payment.");

    // Process payment token with your backend
    const paymentResult = await processPayment(response.details);

    if (paymentResult.success) {
      await response.complete("success");
      log("Transaction Success!");
    } else {
      await response.complete("fail");
      log("Transaction Failed on Server.");
    }
  } catch (err) {
    // Critical for debugging: AbortError often means a config issue or user cancel
    log(`Error: ${err.name} - ${err.message}`);
    console.error("Full Error Object:", err);
  }
}

// Utility for server processing
async function processPayment(details) {
  log("Sending token to backend for processing...");
  // Simulate backend call
  return new Promise((resolve) =>
    setTimeout(() => resolve({ success: true }), 1000)
  );
}

function log(msg) {
  document.getElementById("log").innerText = msg;
  console.log(msg);
}
