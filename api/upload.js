import formidable from "formidable";
import nodemailer from "nodemailer";

export const config = {
  api: { bodyParser: false },
};

// ラベル（フィールド名→日本語）
const LABELS = {
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
  "menu_name[]": "商品名",
  "menu_price[]": "値段",
  "menu_desc[]": "商品説明",
  "formspree_link": "Formspreeリンク",
  "others": "その他",
  "plan": "プラン",

  // 添付写真系
  "logo_photos[]": "ロゴ写真",
  "bg_image": "背景画像",
  "main_visuals[]": "メインビジュアル",
  "gallery[]": "店舗ギャラリー",
  "menu_photo[]": "メニュー写真"
};

// セクション定義
const SECTIONS = {
  "基本情報": ["client_name","client_email"],
  "1. トップページ（ホーム）": ["shop_name","bg_color","catchcopy","intro","faq","address","hours","tel","email","sns_instax","sns_fbly","sns_yt","logo_photos[]","bg_image","main_visuals[]"],
  "2. 店舗紹介・コンセプトページ": ["concept","story","gallery[]"],
  "3. メニュー・商品ページ": ["menu_name[]","menu_price[]","menu_desc[]","menu_photo[]"],
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

    // 添付ファイルリスト
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

    // 本文作成
    let out = "";

    // 各セクション出力
    for (const section in SECTIONS) {
      out += `\n=== ${section} ===\n`;
      if (section === "3. メニュー・商品ページ") {
        // メニュー専用処理
        const menuNames = normArray(fields["menu_name[]"]);
        const menuPrices = normArray(fields["menu_price[]"]);
        const menuDescs = normArray(fields["menu_desc[]"]);
        const menuPhotos = Array.isArray(files["menu_photo[]"]) ? files["menu_photo[]"] : (files["menu_photo[]"] ? [files["menu_photo[]"]] : []);
        if (menuNames.length === 0 && menuPrices.length === 0 && menuDescs.length === 0 && menuPhotos.length === 0) {
          out += "（未入力）\n";
        } else {
          const len = Math.max(menuNames.length, menuPrices.length, menuDescs.length, menuPhotos.length);
          for (let i = 0; i < len; i++) {
            const n = (menuNames[i] && String(menuNames[i]).trim()) ? menuNames[i] : "（未入力）";
            const p = (menuPrices[i] && String(menuPrices[i]).trim()) ? menuPrices[i] : "（未入力）";
            const d = (menuDescs[i] && String(menuDescs[i]).trim()) ? menuDescs[i] : "（未入力）";
            const photoName = menuPhotos[i]?.originalFilename ? `メニュー写真_${i+1}` : "";
            out += `#${i+1} ${photoName} ${n} (${p}) - ${d}\n`;
          }
        }
      } else {
        for (const key of SECTIONS[section]) {
          if (key.endsWith("[]") || key.includes("image") || key.includes("visual") || key.includes("gallery")) {
            // 写真系
            const arr = Array.isArray(files[key]) ? files[key] : (files[key] ? [files[key]] : []);
            if (arr.length) {
              arr.forEach((f,i)=>{
                out += `${(LABELS[key] || key)}_${i+1}\n`;
              });
            } else {
              // 写真がない場合はスキップ（空行不要）
            }
          } else {
            // 通常フィールド
            let val = fields[key];
            if (Array.isArray(val)) val = val.join(", ");
            if (val === undefined || val === null || val === "") val = "（未入力）";
            out += `${(LABELS[key] || key)}: ${val}\n`;
          }
        }
      }
    }

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_USER,
      subject: "New form submission",
      text: out,
      attachments,
    });

    // 成功ページ
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
