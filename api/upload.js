// api/upload.js
import formidable from "formidable";
import fs from "fs";
import nodemailer from "nodemailer";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  console.log("Upload API called...");

  const form = formidable({
    multiples: true,
    keepExtensions: true,
    allowEmptyFiles: false,
  });

  try {
    const [fields, files] = await form.parse(req);
    console.log("Parsed fields:", fields);
    console.log("Parsed files:", files);

    // Gmail transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    const attachments = [];
    for (const key in files) {
      const fileArray = Array.isArray(files[key]) ? files[key] : [files[key]];
      fileArray.forEach((f) => {
        attachments.push({
          filename: f.originalFilename,
          path: f.filepath,
        });
      });
    }

    const info = await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_USER,
      subject: "New form submission",
      text: JSON.stringify(fields, null, 2),
      attachments,
    });

    console.log("Mail sent:", info.messageId);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Form parse or mail send error:", err);
    res.status(500).json({ error: err.message });
  }
}
