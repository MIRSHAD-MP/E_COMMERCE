require("dotenv").config();

const accountSID = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceId = process.env.TWILIO_SERVICE_SID;
const client = require("twilio")(accountSID, authToken);

module.exports = {
  makeOtp: (phone) => {
    return new Promise(async (resolve, reject) => {
      try {
        const verifications = await client.verify
          .services(serviceId)
          .verifications.create({
            to: `+91${phone}`,
            channel: "sms",
          });
        resolve(verifications);
      } catch (error) {
        reject(error);
      }
    });
  },
  verifyOtp: (otp, phone) => {
    return new Promise(async (resolve, reject) => {
      try {
        const verification_check = await client.verify
          .services(serviceId)
          .verificationChecks.create({
            to: `+91${phone}`,
            code: otp,
          });
        resolve(verification_check);
      } catch (error) {
        reject(error);
      }
    });
  },
};