import { supabase } from "../../supabase.js";

export default async function handler(req, res) {
  const { id } = req.query;

  console.log("Searching for ID:", id);
  const { data, error } = await supabase
    .from("generqrcodes")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching QR code:", error);
    return res.status(404).json({ error: "QR Code not found", details: error });
  }

  console.log("Found QR Code Data:", data);

  const updatedScans = updateScan(data.scans);

  const { error: updateError } = await supabase
    .from("generqrcodes")
    .update({ scans: updatedScans })
    .eq("id", id);

  if (updateError) {
    console.error("Error updating scans:", updateError);
    return res.status(500).json({ error: "Failed to update scans" });
  }

  res.redirect(data.url);
}

function updateScan(scans) {
  const d = new Date();
  const year = d.getFullYear();
  const month = d.getMonth();
  scans = scans.slice(0, -1);
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
