import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "gaikwadsameer422@gmail.com",
    pass: process.env.EMAIL_PASSWORD || "lkdj kbtb fysl gwzi",
  },
});

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"Unifoods Security" <${process.env.EMAIL_USER || "gaikwadsameer422@gmail.com"}>`,
      to,
      subject,
      html,
    });
    console.log("Email Dispatched: %s", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Email Transmission Failed (Full Error):", JSON.stringify(error, null, 2));
    console.error("Error Name:", error.name);
    console.error("Error Message:", error.message);
    return { success: false, error: error.message };
  }
};

export const sendCustomerWelcomeEmail = async ({
  email,
  name,
  businessName,
  username,
  password,
  gstNumber,
  creditTerm,
  creditLimit,
}) => {
  if (!email) return;

  const isUrg = gstNumber === "URG" || gstNumber === "Unregistered" || !gstNumber;

  const gstSectionHtml = isUrg
    ? `<div style="background-color: #fff8e1; border-left: 4px solid #ffa000; padding: 14px 18px; margin: 20px 0; border-radius: 6px;">
        <strong style="color: #b78103; font-size: 14px; display: block; margin-bottom: 4px;">GST Registration Notice:</strong>
        <p style="margin: 0; color: #5d4037; font-size: 13px; font-weight: bold;">
          You are an unregistered customer (URG) and GST is not applicable for you.
        </p>
       </div>`
    : `<div style="background-color: #f1f8e9; border-left: 4px solid #7cb342; padding: 14px 18px; margin: 20px 0; border-radius: 6px;">
        <strong style="color: #33691e; font-size: 14px; display: block; margin-bottom: 4px;">GST Registration Details:</strong>
        <p style="margin: 0; color: #2e7d32; font-size: 13px;">
          GSTIN: <strong>${gstNumber}</strong>
        </p>
       </div>`;

  const creditSectionHtml = (creditTerm > 0 || creditLimit > 0)
    ? `<div style="background-color: #f3e5f5; border-left: 4px solid #8e24aa; padding: 14px 18px; margin: 20px 0; border-radius: 6px;">
        <strong style="color: #4a148c; font-size: 14px; display: block; margin-bottom: 6px;">Approved B2B Credit Terms:</strong>
        <p style="margin: 3px 0; color: #4a148c; font-size: 13px;">Credit Term: <strong>${creditTerm > 0 ? `${creditTerm} Days` : 'Immediate (COD)'}</strong></p>
        <p style="margin: 3px 0; color: #4a148c; font-size: 13px;">Approved Credit Limit: <strong>₹${Number(creditLimit || 0).toLocaleString('en-IN')}</strong></p>
       </div>`
    : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to Unifoods</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e0e0e0;">
        
        <!-- Header -->
        <div style="background-color: #d97706; padding: 25px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">Welcome to Unifoods!</h1>
          <p style="color: #fef3c7; margin: 6px 0 0 0; font-size: 14px;">Your B2B Food & Supply Partner</p>
        </div>

        <!-- Body -->
        <div style="padding: 30px; color: #333333; line-height: 1.6;">
          <p style="font-size: 16px; margin-top: 0;">Dear <strong>${name || businessName || "Valued Customer"}</strong>,</p>
          <p style="font-size: 14px; color: #555555;">
            Thank you for registering with <strong>Unifoods</strong> (${businessName || name}). Your account has been successfully created and is ready for placing orders.
          </p>

          <!-- Account Credentials Card -->
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1e293b; font-size: 15px; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px;">Your Account Login Credentials</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 6px 0; color: #64748b; width: 110px;">Username:</td>
                <td style="padding: 6px 0; font-weight: bold; color: #0f172a;">${username}</td>
              </tr>
              ${password ? `
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Password:</td>
                <td style="padding: 6px 0; font-weight: bold; color: #d97706;">${password}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Business:</td>
                <td style="padding: 6px 0; font-weight: bold; color: #0f172a;">${businessName}</td>
              </tr>
            </table>
          </div>

          ${gstSectionHtml}
          ${creditSectionHtml}

          <div style="text-align: center; margin: 30px 0 20px 0;">
            <a href="https://horeca-user-end.vercel.app/login" style="background-color: #d97706; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 25px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 10px rgba(217, 119, 6, 0.3);">Login to Your Account</a>
          </div>

          <p style="font-size: 13px; color: #777777; margin-top: 25px;">
            If you have any questions or need assistance with your orders, please feel free to reply to this email or contact our support team.
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0;">© ${new Date().getFullYear()} Unifoods Supply Chain. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: `Welcome to Unifoods - Your Account Credentials & Registration Details`,
    html,
  });
};
