import { parsePhoneNumberFromString } from "libphonenumber-js";

export const formatPhone = (phone) => {
  if (!phone) return "";

  try {
    const number = parsePhoneNumberFromString(phone, "IN");

    if (number && number.isValid()) {
      const digits = number.nationalNumber;

      // ✅ Force Indian format: 5 + 5
      if (digits.length === 10) {
        return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
      }

      return number.formatInternational();
    }

    // fallback
    const digits = phone.replace(/\D/g, "");

    if (digits.length === 10) {
      return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
    }

    return "+" + digits;

  } catch {
    return phone;
  }
};