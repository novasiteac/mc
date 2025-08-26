import formidable from "formidable";
import nodemailer from "nodemailer";

export const config = {
  api: { bodyParser: false },
};

export default async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Form parse error:", err);
      return res.status(500).send("Error parsing the form");
    }

    console.log("FIELDS:", fields);
    console.log("FILES:", files);

    const name = fields.name?.[0] || "Anonymous";
    const email = fields.email?.[0] || "No email";

    const file = files.logo_photos?.[0] ||
                 files.main_visuals?.[0] ||
                 files.bg_image?.[0] ||
                 files.photo?.[0] ||
                 null;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    try {
      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: process.env.GMAIL_USER,
        subject: `New form submission from ${name}`,
        text: `Sender: ${name} (${email})`,
        attachments: file
          ? [{ filename: file.originalFilename, path: file.filepath }]
          : [],
      });
      console.log("Email sent successfully");
      res.status(200).send("Form submitted successfully!");
    } catch (error) {
      console.error("Email send error:", error);
      res.status(500).send("Failed to send email");
    }
  });
};
