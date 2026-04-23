const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// 📞 CALL
exports.makeCall = async (phone, message) => {
  const call = await client.calls.create({
    to: phone,
    from: process.env.TWILIO_PHONE_NUMBER,
    twiml: `<Response><Say>${message}</Say></Response>`,
  });

  console.log("Call SID:", call.sid);
  return call;
};

// 📩 SMS
exports.sendSMS = async (phone, message) => {
  const msg = await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone,
  });

  console.log("SMS SID:", msg.sid);
  return msg;
};