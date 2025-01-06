import qr from "qrcode";
import { supabase } from "../supabase.js";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { url } = req.body;

    const id_public = generatePrivateID();
    const id_private = generatePrivateID();

    const qrCodeUrl = await qr.toDataURL(
      `${req.headers.origin}/api/red/${id_public}`
    );

    console.log("Generated QR Code URL:", qrCodeUrl);

    await dbNewAdd(id_public, id_private, url);

    res.status(200).json({ id_private, qrCodeUrl });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

function generatePrivateID() {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 18; i++) {
    result += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
  }
  return result;
}

async function dbNewAdd(id_public, id_private, url) {
  const { error } = await supabase.from("generqrcodes").insert([
    {
      id: id_public,
      private_id: id_private,
      url: url,
      created_at: new Date().toISOString(),
      scans: getInitMonthQr(),
    },
  ]);

  if (error) {
    console.error("Error inserting into database:", error);
  }
}

function getInitMonthQr() {
  const d = new Date();
  let month = d.getMonth();
  let year = d.getFullYear();
  return `${year}.${month}:0,`;
}