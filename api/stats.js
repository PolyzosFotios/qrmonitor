import { supabase } from "../supabase.js";

export default async function handler(req, res) {
  const { id } = req.query;

  const { data, error } = await supabase
    .from("generqrcodes")
    .select("*")
    .eq("private_id", id)
    .single();

  if (error) {
    console.error("Error fetching stats:", error);
    return res.status(404).json({
      id: "0",
      url: "",
      scans: "",
      created_at: "",
    });
  }

  res.status(200).json({
    id: data.private_id,
    url: data.url,
    scans: data.scans,
    created_at: data.created_at,
  });
}