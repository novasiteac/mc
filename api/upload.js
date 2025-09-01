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
            filename: (labels[key] || key) + "_" + (f.originalFilename || "file"),
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
      text: (() => {
        const labels = {
          "client_name": "お名前",
          "client_email": "メールアドレス",
          "shop_name": "店舗名",
          "bg_color": "背景色",
          "catchcopy": "キャッチコピー",
          "intro": "紹介文",
          "faq": "よくある質問",
          "address": "住所",
          "hours": "営業時間",
          "tel": "電話番号",
          "email": "メール",
          "sns_instax": "Instagram・X",
          "sns_fbly": "Facebook・LINE",
          "sns_yt": "YouTube",
          "concept": "コンセプト説明",
          "story": "店舗の歴史",
          "menu_name[]": "メニュー名",
          "menu_desc[]": "メニュー説明",
          "formspree_link": "Formspreeリンク",
          "others": "その他",
          "plan": "プラン"
        };
        let out = "";
        // ページごとのセクション定義
        const sections = {
          "基本情報": ["client_name","client_email"],
          "1. トップページ（ホーム）": ["shop_name","bg_color","catchcopy","intro","faq","address","hours","tel","email","sns_instax","sns_fbly","sns_yt"],
          "2. 店舗紹介・コンセプトページ": ["concept","story"],
          "3. メニュー・商品ページ": ["menu_name[]","menu_desc[]"],
          "4. お問い合わせページ": ["formspree_link"],
          "5. その他": ["others","plan"]
        };
        for(const section in sections){
          out += "\n=== " + section + " ===\n";
          for(const key of sections[section]){
            let val = fields[key];
            if(Array.isArray(val)) val = val.join(", ");
            if(!val) val = "（未入力）";
            out += (labels[key] || key) + ": " + val + "\n";
          }
        }
        for (const key in fields) {
          let val = fields[key];
          if (Array.isArray(val)) val = val.join(", ");
          if (!val) val = "（未入力）";
          out += (labels[key] || key) + ": " + val + "\n";
        }
        return out;
      })(),
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
