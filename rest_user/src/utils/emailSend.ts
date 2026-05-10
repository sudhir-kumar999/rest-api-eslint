import nodemailer from "nodemailer";
export const sendMail=async(to:string,template:string)=>{
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // use STARTTLS (upgrade connection to TLS after connecting)
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    const info = await transporter.sendMail({
      from: "akumar07067@gmail.com", // sender address
      to: to, // list of recipients
      subject: "OTP verification", // subject line
      text: "Don't share your to other person", // plain text body
      html: template // HTML body
    });
    return info;
  } catch (error) {
    console.log("Error",error);
  }
};
