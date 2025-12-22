const express = require("express");
const https = require("https");
const fs = require("fs");
const axios = require("axios");
const path = require("path");

const app = express();
app.use("/.well-known", express.static(path.join(__dirname, ".well-known")));

app.use(express.static("public"));
app.use(express.json());

// CONFIGURATION: Update these with your real details
const MERCHANT_IDENTIFIER = "robonito.com";
const DISPLAY_NAME = "My Test Store";

// Load your Apple Merchant Identity Certificate (Required for Validation)
// You download this from developer.apple.com
// const httpsAgent = new https.Agent({
//   cert: fs.readFileSync("./certs/merchant_id.cer"),
//   key: fs.readFileSync("./certs/merchant_id.key"),
//   rejectUnauthorized: false, // strictly for debugging/test environments
// });

// Endpoint: Validate Merchant
// The client calls this when the Apple Pay sheet opens
app.post("/validate-merchant", async (req, res) => {
  const { validationURL } = req.body;

  if (!validationURL) {
    return res.status(400).send("Missing validation URL");
  }

  try {
    // We request a session from Apple servers using our Certs
    const response = await axios.post(
      validationURL,
      {
        merchantIdentifier: MERCHANT_IDENTIFIER,
        displayName: DISPLAY_NAME,
        initiative: "web",
        initiativeContext: "https://robonito.com", // Must match your SSL domain
      },
      { httpsAgent }
    );

    // Send the opaque session object back to the frontend
    res.json(response.data);
  } catch (error) {
    console.error("Merchant Validation Error:", error.message);
    res.status(500).send("Validation failed");
  }
});

// Start Server (Must be HTTPS or localhost for testing)
// Note: Apple Pay allows http on localhost, but requires https for real domains
app.listen(4000, () => {
  console.log("Server running on http://localhost:3000");
});
