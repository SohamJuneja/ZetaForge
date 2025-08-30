// src/lib/alchemy.ts
import axios from "axios";

const ALCHEMY_API_KEY = import.meta.env.VITE_ALCHEMY_API_KEY;


// Base Sepolia endpoint
const BASE_URL = `https://base-sepolia.g.alchemy.com/nft/v2/${ALCHEMY_API_KEY}`;

export async function getNftsForOwner(address: string) {
  try {
    const response = await axios.get(
      `${BASE_URL}/getNFTsForOwner`,
      {
        params: { owner: address }
      }
    );

    return response.data.ownedNfts.map((nft: any) => ({
      id: nft.tokenId,
      name: nft.title || `NFT #${nft.tokenId}`,
      image:
        nft.media[0]?.gateway ||
        "https://via.placeholder.com/300x300?text=No+Image",
      chain: "Base Sepolia",
    }));
  } catch (error) {
    console.error("Error fetching NFTs:", error);
    return [];
  }
}
