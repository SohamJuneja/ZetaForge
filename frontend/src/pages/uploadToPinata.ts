import type { NextApiRequest, NextApiResponse } from "next";

export const config = {
  api: {
    bodyParser: false, // we’ll handle FormData manually
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const PINATA_JWT = process.env.PINATA_JWT;
    if (!PINATA_JWT) {
      return res.status(500).json({ error: "Pinata JWT not configured" });
    }

    const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: req, // pass the raw form-data request through
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err: any) {
    console.error("Pinata upload error:", err);
    res.status(500).json({ error: "Upload failed", details: err.message });
  }
}
