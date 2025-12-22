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
  // 2. Define Payment Methods (Source: "Payment methods" section)
  const methods = [
    {
      supportedMethods: "https://apple.com/apple-pay",
      data: {
        version: 3,
        merchantIdentifier: "merchant.com.thankiopay",
        merchantCapabilities: ["supports3DS"],
        supportedNetworks: ["visa", "masterCard", "amex", "discover"],
        countryCode: "US",
      },
    },
  ];

  // 3. Define Payment Details (Total, items)
  const details = {
    total: {
      label: "Robonito Store",
      amount: { currency: "USD", value: "10.00" },
    },
  };

  // 4. Define Options (Requesting shipping, etc.)
  const options = {
    requestPayerName: true,
    requestPayerEmail: true,
  };

  // Create the Request
  const request = new PaymentRequest(methods, details, options);

  // 5. Handle Merchant Validation (Source: "Complete merchant validation" section)
  request.onmerchantvalidation = (event) => {
    log("Validating Merchant...");

    // Fetch the session from YOUR backend, not Apple directly
    const merchantSessionPromise = fetch("/validate-merchant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        validationURL: event.validationURL,
        origin: window.location.origin,
      }),
    })
      .then((res) => res.json())
      .then((session) => {
        log("Merchant Validated.");
        // Pass the opaque session object to complete the validation
        event.complete(session);
      })
      .catch((err) => {
        console.error("Error fetching merchant session", err);
        log("Merchant Validation Failed.");
      });
  };

  // 6. Handle Payment Authorization (Source: "Authorize the Payment" section)
  try {
    const response = await request.show();

    // Use the token in response.details.token to charge the card on your backend
    console.log("Payment Token Received:", response.details.token);

    // Simulate processing delay
    setTimeout(async () => {
      // "success" or "fail"
      await response.complete("success");
      log("Transaction Completed Successfully!");
    }, 1000);
  } catch (e) {
    log("Payment cancelled or failed.");
  }
}

function log(msg) {
  document.getElementById("log").innerText = msg;
  console.log(msg);
}
