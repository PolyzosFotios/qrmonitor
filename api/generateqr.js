import qr from "qrcode";
import { supabase } from "../supabase.js";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { url } = req.body;

    const id_public = generatePrivateID();
    const id_private = generatePrivateID();

    let totalUrl = `${req.headers.origin}/api/follow/${id_public}`;

    const qrCodeUrl = await qr.toDataURL(totalUrl);

    console.log("Generated QR Code URL:", qrCodeUrl);

    await dbNewAdd(id_public, id_private, url);

    res
      .status(200)
      .json({ id_private, qrCodeUrl, qrCodeRedirectUrl: totalUrl });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

function updateScan(scans) {
  const d = new Date();
  const year = d.getFullYear();
  const month = d.getMonth();
  scans = scans.slice(0, -1); // Αφαίρεση τελευταίου κόμματος
  const scanEntries = scans.split(",");
  let updatedScans = "";

  const lastEntry = scanEntries[scanEntries.length - 1]?.split(":");
  if (lastEntry && lastEntry[0] === `${year}.${month}`) {
    const count = parseInt(lastEntry[1]) + 1;
    scanEntries[scanEntries.length - 1] = `${year}.${month}:${count}`;
  } else {
    scanEntries.push(`${year}.${month}:1`);
  }

  updatedScans = scanEntries.join(",") + ",";
  return updatedScans;
}

function generatePrivateID() {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 18; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
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
