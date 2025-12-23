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
const MERCHANT_IDENTIFIER = "merchant.com.thankiopay";
const DISPLAY_NAME = "Robonito Test Store";

const httpsAgent = new https.Agent({
  cert: fs.readFileSync(path.join(__dirname, "./certs/MerchantId.crt")),
  key: fs.readFileSync(path.join(__dirname, "./certs/MerchantId.key")),
});

app.post("/validate-merchant", async (req, res) => {
  const { validationURL, domainName } = req.body;

  try {
    const response = await axios.post(
      validationURL,
      {
        merchantIdentifier: MERCHANT_IDENTIFIER,
        displayName: DISPLAY_NAME,
        initiative: "web",
        initiativeContext: domainName,
      },
      {
        httpsAgent: httpsAgent,
        headers: { "Content-Type": "application/json" },
      }
    );
    console.log(
      "Merchant validation response:",
      response.status,
      "DATA:",
      response.data
    );
    res.json(response.data);
  } catch (error) {
    console.log("Error during merchant validation:", error);
    res.status(500).send("Validation failed");
  }
});

// Start Server (Must be HTTPS or localhost for testing)
// Note: Apple Pay allows http on localhost, but requires https for real domains
app.listen(4000, () => {
  console.log("Server running on http://localhost:4000");
});
