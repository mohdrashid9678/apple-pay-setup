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
      supportedMethods: "basic-card",
      data: {
        version: 3,
        merchantIdentifier: "merchant.com.thankiopay",
        merchantCapabilities: ["supports3DS"],
        supportedNetworks: ["visa"],
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

  try {
    // This check tells you if Safari sees a valid card for this Merchant ID
    // const canPay = await ApplePaySession.canMakePaymentsWithActiveCard(
    //   "merchant.com.thankiopay"
    // );
    // log("Can pay with active card: " + canPay);

    // if (!canPay) {
    //   log(
    //     "ABORTING: No active card found. Check if you are using a Sandbox account."
    //   );
    //   return;
    // }

    const request = new PaymentRequest(methods, details);
    console.log("PaymentRequest created:", request);

    // FIX 1: Explicitly handle the validation event
    request.onmerchantvalidation = (event) => {
      log("Merchant validation event fired...");

      const sessionPromise = fetch("/validate-merchant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          validationURL: event.validationURL,
          // FIX 2: Send ONLY the hostname, no https://
          domainName: window.location.hostname,
        }),
      })
        .then((res) => res.json())
        .catch((err) => {
          log("Backend failed to fetch session");
          throw err;
        });

      event.complete(sessionPromise);
    };

    // FIX 3: Required to prevent some AbortErrors in newer Safari versions
    request.onpaymentmethodchange = (ev) => ev.updateWith({});

    log("Opening Apple Pay sheet...");
    const response = await request.show();

    // If we get here, the user authorized the payment
    log("Payment authorized!");
    await response.complete("success");
  } catch (err) {
    console.error("Payment Request failed:", err);
    if (err.name === "AbortError") {
      log("AbortError: Sheet closed (Check Domain Verification or Certs)");
    } else {
      log(`Error: ${err.message}`);
    }
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
