import axios from 'axios';
import dotenv from 'dotenv';
import fetch from 'node-fetch-commonjs';
import { Keypair } from "@solana/web3.js";
import { API_URL, authenticate, cacheArweaveImage, uploadImageBlob } from "./server";
import type { Request, Response } from "express";

dotenv.config();

const private_key_raw = JSON.parse(process.env.BUNDLR_PRIVATE_KEY as string);
const private_key_array: number[] = Array.from(private_key_raw);
const private_key = Uint8Array.from(private_key_array);
const keypair = Keypair.fromSecretKey(private_key);

export const imageURLRequestHandler = async (req: Request, res: Response) => {
  const { public_key, signature, url } = req.body;

  if (!public_key || !signature || !url) {
    res.status(400).json({
      error: "Insufficient upload data",
    });
    return;
  };

  // Authenticate the public key using signature
  const authenticated = authenticate(
    public_key,
    signature,
    res
  );
  if (!authenticated) return;

  // Check if user exists
  const user_request = await axios.get(API_URL + '/user/get/' + public_key);
  const user_exists = user_request.status === 200;

  if (!user_exists) {
    res.status(400).json({
      error: "User does not exist",
    });
    return;
  };

  const response = await fetch(url);
  const blob = await response.blob();
  const extension = blob.type.split('/').pop();
  const upload_res = await uploadImageBlob(blob, keypair);

  if (upload_res.url) {
    const cache_to_cdn_response = await cacheArweaveImage(upload_res.url);
    if (!cache_to_cdn_response) {
      return res.status(500).json(cache_to_cdn_response);
    }
    res.status(200).json(upload_res);
  } else {
    res.status(400).json(upload_res);
  }

}