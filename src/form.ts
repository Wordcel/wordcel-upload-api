import axios from 'axios';
import dotenv from 'dotenv';

import formidable, { File as FormidableFile } from "formidable";
import { Keypair } from "@solana/web3.js";
import { authenticate, uploadImageNode } from "./server";
import type { Request, Response } from "express";

type ProcessedFiles = Array<[string, FormidableFile]>;

dotenv.config();

const private_key_raw = JSON.parse(process.env.BUNDLR_PRIVATE_KEY as string);
const private_key_array: number[] = Array.from(private_key_raw);
const private_key = Uint8Array.from(private_key_array);
const keypair = Keypair.fromSecretKey(private_key);

const requestHandler = async (req: Request, res: Response) => {

  const body = {
    public_key: '',
    signature: ''
  }

  // Collect all the files
  const files = await new Promise<ProcessedFiles | undefined>(
    (resolve, reject) => {
      const form = new formidable.IncomingForm();
      const files: ProcessedFiles = [];
      form.on("file", function (field, file) {
        files.push([field, file]);
      });
      form.on("error", (err) => reject(err));
      form.parse(req, async (err, fields) => {
        if (err) {
          res.writeHead(err.httpCode || 400, { "Content-Type": "text/plain" });
          res.end(String(err));
          return;
        }
        const { public_key, signature } = fields;

        if (!public_key || !signature) {
          res.status(400).json({
            error: "Insufficient authorization data",
          });
          return;
        }

        body.public_key = public_key as string;
        body.signature = signature as string;
        resolve(files);
      });
    }
  );

  // Authenticate the public key using signature
  const authenticated = authenticate(
    body.public_key as string,
    JSON.parse(body.signature as string),
    res
  );
  if (!authenticated) return;

  // Check if user exists
  const user_request = await axios.get('https://wordcelclub.com/api/user/get/' + body.public_key);
  const user_exists = user_request.status === 200;

  if (!user_exists) {
    res.status(400).json({
      error: "User does not exist",
    });
    return;
  }

  const image = files?.[0][1];
  if (!image) return;

  if (image.size > 8e+6) {
    const response = { url: null, error: "Please upload an image less than 8mb in size"};
    res.status(400).json(response);
    return;
  }

  const response = await uploadImageNode(image, keypair);
  if (response.error) {
    res.status(500).json(response)
  } else {
    res.status(200).json(response);
  }

};

export { requestHandler }