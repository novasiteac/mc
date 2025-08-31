import formidable from "formidable";
import nodemailer from "nodemailer";

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const form = formidable({
    multiples: true,
    keepExtensions: true,
    allowEmptyFiles: true,
    minFileSize: 0,
  });

  try {
    const [fields, files] = await form.parse(req);

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
        if (f && f.filepath) {
          attachments.push({
            filename: f.originalFilename || "file",
            path: f.filepath,
          });
        }
      });
    }

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_USER,
      subject: "New form submission",
      text: JSON.stringify(fields, null, 2),
      attachments,
    });

    // Instead of JSON, return HTML success page
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(`<!doctype html>
<html lang="ja"><head>
<meta charset="utf-8"><title>送信完了</title>
<link rel="stylesheet" href="/styles.css">
</head><body class="container">
  <h1>送信完了しました</h1>
  <p>お問い合わせいただきありがとうございます。送信が正常に完了しました。</p>
  <a href="/index.html" class="btn">ホームへ戻る</a>
</body></html>`);
  } catch (err) {
    console.error("Form parse or mail send error:", err);
    res.status(500).send("エラーが発生しました: " + err.message);
  }
}
