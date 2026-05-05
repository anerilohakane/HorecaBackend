import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
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
    console.error("Email Transmission Failed:", error);
    return { success: false, error: error.message };
  }
};
