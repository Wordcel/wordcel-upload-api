import axios from 'axios';
import { Request, Response } from 'express';
import { API_URL, authenticate, cacheArweaveImage, getKeypair, uploadJSON } from './server'

async function uploadJSONHandler(req: Request, res: Response) {
  const { public_key, signature, data, tags } = req.body;

  if (!public_key || !signature || !data || !tags) {
    res.status(400).json({
      error: 'Insufficient request data',
    });
    return;
  }

  // Authenticate the public key using signature
  const authenticated = authenticate(
    public_key as string,
    signature,
    res
  );
  if (!authenticated) return;

  // Check if user exists
  const user_request = await axios.get(
    API_URL + '/user/get/' + public_key
  );
  const user_exists = user_request.status === 200;

  if (!user_exists) {
    res.status(400).json({
      error: 'User does not exist',
    });
    return;
  }

  // Upload the JSON
  const keypair = getKeypair();
  const response = await uploadJSON(
    JSON.stringify(data),
    tags,
    keypair
  );

  if (response.url) {
    const cache_to_cdn_response = await cacheArweaveImage(response.url);
    if (cache_to_cdn_response.error) {
      res.status(500).json(cache_to_cdn_response);
    }
    return res.status(200).json(response);
  } else {
    return res.status(500).json(response);
  }

}

export { uploadJSONHandler };
