// utils/validation.js - Updated version
export const validators = {
  // Alphabets + spaces only (1-40 chars)
  name: (v) => /^[A-Za-z\s]{1,40}$/.test(v?.trim() || ''),
  
  // Email (RFC-like)
  email: (v) => /^\S+@\S+\.\S+$/.test(v || ''),
  
  // Indian mobile – 10 digits starting with 6-9
  phone: (v) => /^[6-9]\d{9}$/.test(v?.replace(/\D/g, '') || ''),
  
  // Positive integer (for basic salary)
  positiveNumber: (v) => /^\d+$/.test(v) && parseInt(v) > 0,
  
  // Account number – 9-18 digits
  accountNumber: (v) => /^\d{9,18}$/.test(v),
  
  // IFSC – 4 letters + 0 + 6 alphanum
  ifsc: (v) => /^[A-Z]{4}0[A-Z0-9]{6}$/.test((v || '').toUpperCase()),
  
  // PAN – 5 letters + 4 digits + 1 letter
  pan: (v) => /^[A-Z]{5}\d{4}[A-Z]$/.test((v || '').toUpperCase()),
  
  // Aadhar – exactly 12 digits
  aadhar: (v) => /^\d{12}$/.test(v),
  
  // ZIP – 6 digits
  zip: (v) => !v || /^\d{6}$/.test(v),
};