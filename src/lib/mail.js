import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // Use SSL
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"Unifoods Security" <${process.env.EMAIL_FROM}>`,
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
