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
        merchantIdentifier: "merchant.com.yourdomain.test", // Must match backend
        merchantCapabilities: ["supports3DS"],
        supportedNetworks: ["visa", "masterCard", "amex", "discover"],
        countryCode: "US",
      },
    },
  ];

  // 3. Define Payment Details (Total, items)
  const details = {
    total: {
      label: "My Store",
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
      body: JSON.stringify({ validationURL: event.validationURL }),
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

function onApplePayButtonClicked() {
  if (!ApplePaySession) {
    return;
  }

  // Define ApplePayPaymentRequest
  const request = {
    countryCode: "US",
    currencyCode: "USD",
    merchantCapabilities: ["supports3DS"],
    supportedNetworks: ["visa", "masterCard", "amex", "discover"],
    total: {
      label: "Demo (Card is not charged)",
      type: "final",
      amount: "1.99",
    },
  };

  // Create ApplePaySession
  const session = new ApplePaySession(3, request);

  session.onvalidatemerchant = async (event) => {
    // Call your own server to request a new merchant session.
    const merchantSession = await validateMerchant();
    session.completeMerchantValidation(merchantSession);
  };

  session.onpaymentmethodselected = (event) => {
    // Define ApplePayPaymentMethodUpdate based on the selected payment method.
    // No updates or errors are needed, pass an empty object.
    const update = {};
    session.completePaymentMethodSelection(update);
  };

  session.onshippingmethodselected = (event) => {
    // Define ApplePayShippingMethodUpdate based on the selected shipping method.
    // No updates or errors are needed, pass an empty object.
    const update = {};
    session.completeShippingMethodSelection(update);
  };

  session.onshippingcontactselected = (event) => {
    // Define ApplePayShippingContactUpdate based on the selected shipping contact.
    const update = {};
    session.completeShippingContactSelection(update);
  };

  session.onpaymentauthorized = (event) => {
    // Define ApplePayPaymentAuthorizationResult
    const result = {
      status: ApplePaySession.STATUS_SUCCESS,
    };
    session.completePayment(result);
  };

  session.oncouponcodechanged = (event) => {
    // Define ApplePayCouponCodeUpdate
    const newTotal = calculateNewTotal(event.couponCode);
    const newLineItems = calculateNewLineItems(event.couponCode);
    const newShippingMethods = calculateNewShippingMethods(event.couponCode);
    const errors = calculateErrors(event.couponCode);

    session.completeCouponCodeChange({
      newTotal: newTotal,
      newLineItems: newLineItems,
      newShippingMethods: newShippingMethods,
      errors: errors,
    });
  };

  session.oncancel = (event) => {
    // Payment canceled by WebKit
  };

  session.begin();
}
