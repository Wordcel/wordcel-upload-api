import axios from 'axios';
import { API_URL, authenticate, cacheArweaveImage, getKeypair, uploadImageNode } from "./server";
import formidable, { File as FormidableFile } from "formidable";
import type { Request, Response } from "express";

type ProcessedFiles = Array<[string, FormidableFile]>;

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
  // const user_request = await axios.get(API_URL + '/user/get/' + body.public_key);
  // const user_exists = user_request.status === 200;

//   if (!user_exists) {
//     res.status(400).json({
//       error: "User does not exist",
//     });
//     return;
//   }

  const image = files?.[0][1];
  if (!image) return;

  if (image.size > 8e+6) {
    const response = { url: null, error: "Please upload an image less than 8mb in size"};
    res.status(400).json(response);
    return;
  }

  const keypair = getKeypair();
  const response = await uploadImageNode(image, keypair);
  if (response.error) {
    res.status(500).json(response)
  } else {
    const cache_to_cdn_response = await cacheArweaveImage(response.url!);
    if (!cache_to_cdn_response) {
      return res.status(500).json(cache_to_cdn_response);
    }
    res.status(200).json(response);
  }

};

export { requestHandler }
