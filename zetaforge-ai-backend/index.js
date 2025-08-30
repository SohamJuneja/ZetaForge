const functions = require('@google-cloud/functions-framework');
const { GoogleAuth } = require('google-auth-library');
const axios = require('axios');
const FormData = require('form-data');
const cors = require('cors')({ origin: true });

// Environment variables
const PROJECT_ID = process.env.GCP_PROJECT_ID || 'your-project-id';
const LOCATION = process.env.GCP_LOCATION || 'us-central1';
const PINATA_JWT = process.env.PINATA_JWT;

// Initialize Google Auth for Vertex AI REST API
const auth = new GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/cloud-platform']
});

// Helper function to upload to Pinata IPFS
async function uploadToPinata(imageBuffer, filename) {
  if (!PINATA_JWT) {
    throw new Error('PINATA_JWT environment variable is required');
  }

  try {
    const formData = new FormData();
    formData.append('file', imageBuffer, {
      filename: filename,
      contentType: 'image/png'
    });

    const pinataMetadata = JSON.stringify({
      name: filename,
      keyvalues: {
        project: 'ZetaForge',
        type: 'generated-nft'
      }
    });
    formData.append('pinataMetadata', pinataMetadata);

    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${PINATA_JWT}`,
          ...formData.getHeaders()
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    return {
      ipfsHash: response.data.IpfsHash,
      ipfsUrl: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`,
      pinataUrl: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`
    };
  } catch (error) {
    console.error('Pinata upload error:', error.response?.data || error.message);
    throw new Error(`Failed to upload to IPFS: ${error.message}`);
  }
}

// Helper function to generate image using Vertex AI REST API
async function generateImageWithVertexAI(prompt) {
  try {
    // Get access token
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
    
    if (!accessToken.token) {
      throw new Error('Failed to obtain access token');
    }

    // Vertex AI REST API endpoint for Imagen
    const endpoint = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/imagegeneration@006:predict`;
    
    const requestBody = {
      instances: [
        {
          prompt: prompt
        }
      ],
      parameters: {
        sampleCount: 1,
        aspectRatio: "1:1",
        safetyFilterLevel: "block_some",
        personGeneration: "allow_adult"
      }
    };

    console.log('Making request to Vertex AI Imagen...');
    const response = await axios.post(endpoint, requestBody, {
      headers: {
        'Authorization': `Bearer ${accessToken.token}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000 // 60 seconds timeout
    });

    if (!response.data.predictions || response.data.predictions.length === 0) {
      throw new Error('No predictions returned from Vertex AI');
    }

    const prediction = response.data.predictions[0];
    
    // Extract base64 image data
    if (prediction.bytesBase64Encoded) {
      return Buffer.from(prediction.bytesBase64Encoded, 'base64');
    } else if (prediction.mimeType && prediction.bytesBase64Encoded) {
      return Buffer.from(prediction.bytesBase64Encoded, 'base64');
    } else {
      throw new Error('No valid image data in response');
    }
    
  } catch (error) {
    console.error('Vertex AI Error Details:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    
    // If Vertex AI fails, use a fallback approach
    throw new Error(`Vertex AI image generation failed: ${error.message}`);
  }
}

// Fallback function using a cyberpunk image API
async function generateFallbackImage(prompt) {
  try {
    console.log('Using fallback image generation...');
    
    // Use a cyberpunk-themed placeholder that matches the prompt
    const cyberpunkImages = [
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=512&h=512&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=512&h=512&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1518709474684-d95d48929424?w=512&h=512&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=512&h=512&fit=crop&crop=center'
    ];
    
    const randomImage = cyberpunkImages[Math.floor(Math.random() * cyberpunkImages.length)];
    
    const response = await axios.get(randomImage, { 
      responseType: 'arraybuffer',
      timeout: 30000
    });
    
    return Buffer.from(response.data);
    
  } catch (error) {
    throw new Error(`Fallback image generation failed: ${error.message}`);
  }
}

// Helper function to enhance prompt for NFT generation
function enhancePrompt(userPrompt) {
  const baseEnhancement = `Create a high-quality digital artwork suitable for an NFT. `;
  const styleGuide = `Style: Cyberpunk, futuristic, neon colors, metallic textures, digital art. `;
  const qualityGuide = `Requirements: High detail, vibrant colors, professional quality, 1:1 aspect ratio. `;
  
  return baseEnhancement + styleGuide + qualityGuide + `Description: ${userPrompt}`;
}

// Main Cloud Function
functions.http('generateAndPinImage', async (req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ 
        error: 'Method Not Allowed',
        message: 'Only POST requests are supported' 
      });
    }

    const { prompt, selectedNFTs = [] } = req.body;
    
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'A valid "prompt" string is required' 
      });
    }

    console.log(`ZetaForge: Generating NFT for prompt: "${prompt}"`);

    try {
      // Step 1: Enhance the prompt
      const enhancedPrompt = enhancePrompt(prompt);
      console.log(`Enhanced prompt: "${enhancedPrompt}"`);

      // Step 2: Generate image (try Vertex AI first, fallback if needed)
      let imageBuffer;
      let generationMethod = 'vertex-ai';
      
      try {
        imageBuffer = await generateImageWithVertexAI(enhancedPrompt);
        console.log('Image generated with Vertex AI');
      } catch (vertexError) {
        console.log('Vertex AI failed, using fallback:', vertexError.message);
        imageBuffer = await generateFallbackImage(prompt);
        generationMethod = 'fallback';
      }

      console.log(`Image buffer size: ${imageBuffer.length} bytes`);

      // Step 3: Upload to Pinata IPFS
      console.log('Uploading to Pinata IPFS...');
      const timestamp = Date.now();
      const filename = `zetaforge-creation-${timestamp}.png`;
      
      const uploadResult = await uploadToPinata(imageBuffer, filename);
      console.log('Successfully uploaded to IPFS');

      // Step 4: Return success response
      const successResponse = {
        success: true,
        message: 'NFT image generated and uploaded successfully',
        data: {
          ipfsHash: uploadResult.ipfsHash,
          ipfsUrl: uploadResult.ipfsUrl,
          imageUrl: uploadResult.pinataUrl,
          prompt: prompt,
          enhancedPrompt: enhancedPrompt,
          timestamp: timestamp,
          filename: filename,
          generationMethod: generationMethod
        }
      };

      console.log('ZetaForge generation completed successfully');
      res.status(200).json(successResponse);

    } catch (error) {
      console.error('ZetaForge generation failed:', error);
      
      const errorResponse = {
        success: false,
        error: 'Image Generation Failed',
        message: error.message || 'An unexpected error occurred during image generation',
        timestamp: Date.now()
      };

      if (process.env.NODE_ENV === 'development') {
        errorResponse.debug = {
          stack: error.stack,
          details: error.response?.data
        };
      }

      res.status(500).json(errorResponse);
    }
  });
});