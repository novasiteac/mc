import formidable from "formidable";
import nodemailer from "nodemailer";

export const config = {
  api: { bodyParser: false },
};

// ラベル（フィールド名→日本語）
const LABELS = {
  // 基本情報
  "client_name": "お名前",
  "client_email": "メールアドレス",
  // トップページ
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
  // 店舗紹介
  "concept": "コンセプト説明",
  "story": "店舗の歴史",
  // メニュー
  "menu_name[]": "メニュー名",
  "menu_desc[]": "メニュー説明",
  // お問い合わせ
  "formspree_link": "Formspreeリンク",
  // その他
  "others": "その他",
  "plan": "プラン",

  // 添付ファイル(写真)
  "logo_photos[]": "ロゴ写真",
  "bg_image": "背景画像",
  "main_visuals[]": "メインビジュアル",
  "gallery[]": "店舗ギャラリー",
  "menu_photo[]": "メニュー写真"
};

// セクション定義（メール本文をページごとに見出しで分ける）
const SECTIONS = {
  "基本情報": ["client_name","client_email"],
  "1. トップページ（ホーム）": ["shop_name","bg_color","catchcopy","intro","faq","address","hours","tel","email","sns_instax","sns_fbly","sns_yt"],
  "2. 店舗紹介・コンセプトページ": ["concept","story"],
  "3. メニュー・商品ページ": [], // メニューは特別フォーマットで後段に出力
  "4. お問い合わせページ": ["formspree_link"],
  "5. その他": ["others","plan"]
};

function normArray(v) {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

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

    // 添付ファイル
    const attachments = [];
    for (const key in files) {
      const arr = Array.isArray(files[key]) ? files[key] : [files[key]];
      arr.forEach((f, i) => {
        if (f && f.filepath) {
          attachments.push({
            filename: `${(LABELS[key] || key)}_${f.originalFilename || "file"}`,
            path: f.filepath,
          });
        }
      });
    }

    // メール本文（セクション見出し + 各項目）
    let out = "";

    // 1) 各セクション（メニュー以外）
    for (const section in SECTIONS) {
      if (section === "3. メニュー・商品ページ") continue; // 後で特別出力
      out += `\n=== ${section} ===\n`;
      for (const key of SECTIONS[section]) {
        let val = fields[key];
        if (Array.isArray(val)) val = val.join(", ");
        if (val === undefined || val === null || val === "") val = "（未入力）";
        out += `${(LABELS[key] || key)}: ${val}\n`;
      }
    }

    // 2) メニュー（名前と説明を#番号でペア表示）
    const menuNames = normArray(fields["menu_name[]"]);
    const menuDescs = normArray(fields["menu_desc[]"]);
    out += `\n=== 3. メニュー・商品ページ ===\n`;
    if (menuNames.length === 0 && menuDescs.length === 0) {
      out += "（未入力）\n";
    } else {
      const len = Math.max(menuNames.length, menuDescs.length);
      for (let i = 0; i < len; i++) {
        const n = (menuNames[i] && String(menuNames[i]).trim()) ? menuNames[i] : "（未入力）";
        const d = (menuDescs[i] && String(menuDescs[i]).trim()) ? menuDescs[i] : "（未入力）";
        out += `#${i+1} ${n} - ${d}\n`; // 例: #1 ショートケーキ - 旬のいちごを使用
      }
    }

    // 3) 添付写真の一覧（どの写真か分かるように）
    if (Object.keys(files).length) {
      out += `\n=== 添付写真 ===\n`;
      for (const key in files) {
        const arr = Array.isArray(files[key]) ? files[key] : [files[key]];
        arr.forEach((f, i) => {
          const name = f?.originalFilename || "file";
          out += `${(LABELS[key] || key)} ${i+1}: ${name}\n`;
        });
      }
    }

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_USER,
      subject: "New form submission",
      text: out,
      attachments,
    });

    // 成功ページ（HTML）
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(`<!doctype html>
<html lang="ja"><head>
<meta charset="utf-8"><title>送信完了</title>
<link rel="stylesheet" href="/styles.css">
</head><body class="container">
  <h1>送信完了しました</h1>
  <p>ありがとうございました。送信が正常に完了しました。</p>
  <a href="/index.html" class="btn">ホームへ戻る</a>
</body></html>`);
  } catch (err) {
    console.error("Form parse or mail send error:", err);
    res.status(500).send("エラーが発生しました: " + err.message);
  }
}
