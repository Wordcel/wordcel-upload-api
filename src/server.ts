import fs from 'fs';
import axios from 'axios';
import dotenv from 'dotenv';
import * as nacl from 'tweetnacl';
import {
  PublicKey,
  Keypair,
  clusterApiUrl
} from '@solana/web3.js';
import Bundlr from '@bundlr-network/client';
import BigNumber from 'bignumber.js';
import type { Response } from 'express';
import type { File as FormidableFile } from 'formidable';

export const CLUSTER = 'mainnet-beta';
export const MESSAGE_TO_SIGN = 'WORDCEL';
export const MAINNET_ENDPOINT = clusterApiUrl(CLUSTER);
export const BUNDLR_MAINNET_ENDPOINT = 'https://node1.bundlr.network';
export const API_URL = 'https://wordcelclub.com/api';
export const CACHE_IMAGE_URL = 'https://9bosz4fi61.execute-api.us-east-1.amazonaws.com/og-image-generator-arweave-cdn-lambda';
export const CDN_URL = 'https://og.wdclclub.com/arweave/';

export const authenticate = (
  public_key: string,
  signature: any,
  res: Response,
): boolean => {
  const message = new TextEncoder().encode(MESSAGE_TO_SIGN);
  const public_key_bytes = new PublicKey(public_key).toBytes();
  const parsedSignature = new Uint8Array(signature.data ? signature.data : Object.values(signature));
  const verified = nacl.sign.detached.verify(message, parsedSignature, public_key_bytes);
  if (!verified) {
    res.status(401).json({ detail: 'Unauthenticated' });
    return false;
  }
  return true;
};

export async function getBundlrBalance (
  public_key: string
) {
  try {
    const request = await axios.get(BUNDLR_MAINNET_ENDPOINT + '/account/balance/solana?address=' + public_key);
    const response = await request.data;
    const balance = new BigNumber(response.balance);
    return balance;
  } catch (e) {
    console.error(e);
    return new BigNumber(0);
  }
};

export const uploadImageNode = async (
  image: FormidableFile,
  keypair: Keypair
) => {
  if (!image.originalFilename) return { url: null, error: "File name not present" };

  const allowedExtensions = ['png', 'jpg', 'jpeg', 'gif'];
  const extension = image.originalFilename.split('.').pop();

  if (!extension) {
    return { url: null, error: "Invalid file extension" }
  }

  if (!allowedExtensions.includes(extension)) {
    return { url: null, error: "File type not allowed" }
  }

  const type = extension === 'jpg' ? 'jpeg' : extension;
  const tags = [{ name: "Content-Type", value: `image/${type}` }];

  const bundlr = new Bundlr(
    BUNDLR_MAINNET_ENDPOINT,
    'solana',
    keypair.secretKey,
    {
      timeout: 60000,
      providerUrl: MAINNET_ENDPOINT,
    },
  );

  const size = image.size;
  const price = await bundlr.getPrice(size);
  const minimumFunds = price.multipliedBy(3);

  let skipFund = false;

  if (keypair.publicKey) {
    const currentBalance = await getBundlrBalance(keypair.publicKey.toBase58());
    if (!currentBalance.lt(minimumFunds)) skipFund = true;
  }

  if (!skipFund) {
    const toFundAmount = price.multipliedBy(50);
    console.log(`Funding: ${toFundAmount}`);
    try {
      await bundlr.fund(toFundAmount);
    }
    catch (e) {
      console.log(e);
      return { url: null, error: "Insufficient balance to upload" };
    }
  }
  const arrayBuffer = fs.readFileSync(image.filepath, null);
  const file = new Uint8Array(arrayBuffer);

  const transaction = bundlr.createTransaction(file, { tags });
  await transaction.sign();
  await transaction.upload();
  const id = transaction.id;

  if (!id) {
    return { url: null, error: "Error while trying to upload image to arweave" };
  }

  const url = 'https://arweave.net/' + id;
  return { url: url, error: null };
}

export const uploadImageBlob = async (
  image: Blob,
  keypair: Keypair
) => {
  if (!image.type) return { url: null, error: "File type not present" };

  const allowedExtensions = ['png', 'jpg', 'jpeg', 'gif'];
  const extension = image.type.split('/').pop();

  if (!extension) {
    return { url: null, error: "Invalid file extension" }
  }

  if (!allowedExtensions.includes(extension)) {
    return { url: null, error: "File type not allowed" }
  }

  const type = extension === 'jpg' ? 'jpeg' : extension;
  const tags = [{ name: "Content-Type", value: `image/${type}` }];

  const bundlr = new Bundlr(
    BUNDLR_MAINNET_ENDPOINT,
    'solana',
    keypair.secretKey,
    {
      timeout: 60000,
      providerUrl: MAINNET_ENDPOINT,
    },
  );

  const size = image.size;
  const price = await bundlr.getPrice(size);
  const minimumFunds = price.multipliedBy(3);

  let skipFund = false;

  if (keypair.publicKey) {
    const currentBalance = await getBundlrBalance(keypair.publicKey.toBase58());
    if (!currentBalance.lt(minimumFunds)) skipFund = true;
  }

  if (!skipFund) {
    const toFundAmount = price.multipliedBy(50);
    console.log(`Funding: ${toFundAmount}`);
    try {
      await bundlr.fund(toFundAmount);
    }
    catch (e) {
      console.log(e);
      return { url: null, error: "Insufficient balance to upload" };
    }
  }

  const file = await image.arrayBuffer();
  const transaction = bundlr.createTransaction(new Uint8Array(file), { tags });

  await transaction.sign();
  await transaction.upload();
  const id = transaction.id;

  if (!id) {
    return { url: null, error: "Error while trying to upload image to arweave" };
  }

  const url = 'https://arweave.net/' + id;
  return { url: url, error: null };
}

export const uploadJSON = async (
  data: string,
  tags: [{ name: string, value: string }],
  keypair: Keypair
) => {
  const bundlr = new Bundlr(
    BUNDLR_MAINNET_ENDPOINT,
    'solana',
    keypair.secretKey,
    {
      timeout: 60000,
      providerUrl: MAINNET_ENDPOINT,
    },
  );

  const price = await bundlr.getPrice(data.length);
  const minimumFunds = price.multipliedBy(50);

  let skipFund = false;

  if (keypair.publicKey) {
    const currentBalance = await getBundlrBalance(keypair.publicKey.toBase58());
    if (!currentBalance.lt(minimumFunds)) skipFund = true;
  }

  if (!skipFund) {
    const toFundAmount = price.multipliedBy(100);
    console.log(`Funding: ${toFundAmount}`);
    try {
      await bundlr.fund(toFundAmount);
    }
    catch (e) {
      console.log(e);
      return { url: null, error: "Insufficient balance to upload" };
    }
  }

  const transaction = bundlr.createTransaction(data, { tags });
  await transaction.sign();
  await transaction.upload();
  const id = transaction.id;

  if (!id) {
    return { url: null, error: "Error while trying to upload data to arweave" };
  }

  const url = 'https://arweave.net/' + id;
  return { url: url, error: null };
}

export function getKeypair() {
  dotenv.config();
  const private_key_raw = JSON.parse(process.env.BUNDLR_PRIVATE_KEY as string);
  const private_key_array: number[] = Array.from(private_key_raw);
  const private_key = Uint8Array.from(private_key_array);
  const keypair = Keypair.fromSecretKey(private_key);
  return keypair;
}

export const cacheArweaveImage = async (url: string) => {
  const cdnUrlWithParams = `${CACHE_IMAGE_URL}?arweaveUrl=${encodeURIComponent(url)}`;
  try {
    const res = await axios.get(cdnUrlWithParams, { responseType: 'json' });
    if (res.data.message === 'success') {
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}