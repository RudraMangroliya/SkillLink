import nodemailer from "nodemailer";

export const sendEmail = async (options: { email: string; subject: string; message: string; html?: string }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: process.env.SMTP_PORT === '587' ? false : true,
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,
      socketTimeout: 10000,
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const mailOptions = {
      from: `"SkillLink Job Portal" <${process.env.FROM_EMAIL || process.env.SMTP_EMAIL}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      ...(options.html && { html: options.html }),
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email successfully sent to ${options.email}`);
  } catch (error: any) {
    console.error("CRITICAL ERROR: Failed to send email:", error.message);
    if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
      console.error("Missing SMTP_EMAIL or SMTP_PASSWORD in environment variables.");
    } else {
      console.error("SMTP Variables exist, but authentication failed. Ensure you are using a 16-letter App Password, NOT your regular Gmail password.");
    }
  }
};
