import express from "express";
import bodyParser from "body-parser";
import qr from "qrcode";
import { supabase } from "./supabase.js";

const app = express();
const port = 3000;

app.use(bodyParser.json());

app.use(express.static("public"));

app.listen(port, () => console.log(`Server listening to port ${port}`));

app.post("/generateqr", async (req, res) => {
  console.log("In index.js...");
  const { url } = req.body;
  const id_public = generatePrivateID();
  const id_private = generatePrivateID();
  console.log(id_public);
  console.log(id_private);
  console.log(url);

  const qrCodeUrl = await qr.toDataURL(
    `${req.protocol}://${req.get("host")}/follow/${id_public}`
  );
  res.json({ id_private, qrCodeUrl });
  await dbNewAdd(id_public, id_private, url);
});

app.get("/follow/:id", async (req, res) => {
  const id = req.params.id;
  let red_to_url = await scanQrCode(id);
  res.redirect(red_to_url);
});

app.get("/stats/:id", async (req, res) => {
    console.log("Ksekinhsa na psaxnw...");
    try {
        
        const private_id = req.params.id;
      const { data, error } = await supabase
        .from("generqrcodes")
        .select("*")
        .eq("private_id", private_id)
        .single();

        console.log(data.private_id);
      if (error) {
        console.error("Error fetching stats1:", error);
        return res
          .status(404)
          .json({ error: "Stats not found for the given ID." });
      }

      return res.json({
        id: data.private_id,
        url: data.url,
        scans: data.scans,
        created_at: data.created_at,
      });
    } catch (error) {
      console.error("Error fetching stats2:", error);
      return res.json({
        id: "0",
        url: "",
        scans: "",
        created_at: "",
      });
    }
  }
);

async function scanQrCode(id) {
  const { data, error } = await supabase
    .from("generqrcodes")
    .select("*")
    .eq("id", id)
    .single();

  let scan_text = data.scans;
  let new_scans = AddNewScan(scan_text);

  const { dt, err } = await supabase
    .from("generqrcodes")
    .update({ scans: new_scans })
    .eq("id", id);

  return data.url;
}

function AddNewScan(scans) {
  scans = scans.slice(0, -1);
  const scanEntries = scans.split(",");

  const d = new Date();
  const month = d.getMonth();
  const year = d.getFullYear();

  let lastEnt = scanEntries.slice(-1);
  const lastEntInfo = lastEnt[0].split(":"); //["2025.1", "10"]

  let scans_compressed = "";
  console.log("-> : " + lastEntInfo[0]);
  if (lastEntInfo[0] === `${year}.${month}`) {
    let new_scans = parseInt(lastEntInfo[1], 10) + 1;
    scanEntries.pop();
    scanEntries.push(`${year}.${month}:${new_scans}`);

    scanEntries.forEach((scan) => {
      scans_compressed += scan + ",";
    });
    console.log("EXISTED: " + scans_compressed);
  } else {
    scanEntries.push(`${year}.${month}:1`);
    scanEntries.forEach((scan) => {
      scans_compressed += scan;
    });
    console.log("NON EXISTED: " + scans_compressed);
  }
  return scans_compressed;
}

async function dbNewAdd(id_pu, id_pr, url) {
  const { data, error } = await supabase.from("generqrcodes").insert([
    {
      id: id_pu,
      url: url,
      created_at: new Date().toISOString().split('T')[0],
      private_id: id_pr,
      scans: getInitMonthQr(),
    },
  ]);
  if (error) {
    console.error("Error inserting into database:", error);
  } else {
    console.log("New QR code entry added to database:", data);
  }
}

function getInitMonthQr() {
  const d = new Date();
  let month = d.getMonth();
  let year = d.getFullYear();
  return `${year}.${month}:0,`;
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
