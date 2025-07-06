const generateToken = async () => {
  try {
    const response = await fetch(process.env.BKASH_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        username: process.env.BKASH_USERNAME,
        password: process.env.BKASH_PASSWORD,
      },
      body: JSON.stringify({
        app_key: process.env.BKASH_APP_KEY,
        app_secret: process.env.BKASH_SECRET_KEY,
      }),
    });
    const { id_token } = await response.json();
    return id_token;
  } catch (error) {
    return error;
  }
};
const generatePaymentUrl = async (pack, businessID) => {
  try {
    const id_token = await generateToken();
    const { name, price, sms, bonus } = pack;
    const payerReference = JSON.stringify({
      name,
      sms,
      bonus,
      businessID,
    });
    const response = await fetch(process.env.BKASH_PAYMENT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: id_token,
        "X-App-Key": process.env.BKASH_APP_KEY,
      },
      body: JSON.stringify({
        mode: "0011",
        payerReference,
        callbackURL: process.env.BKASH_CALLBACK_URL,
        amount: price,
        currency: "BDT",
        intent: "sale",
        merchantInvoiceNumber: `Inv${Date.now()}`,
      }),
    });
    const { bkashURL } = await response.json();
    return bkashURL;
  } catch (error) {
    return error;
  }
};
const executePayment = async (paymentID) => {
  try {
    const id_token = await generateToken();
    const response = await fetch(process.env.BKASH_EXECUTE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: id_token,
        "X-App-Key": process.env.BKASH_APP_KEY,
      },
      body: JSON.stringify({ paymentID }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return error;
  }
};

module.exports = { generateToken, generatePaymentUrl, executePayment };
