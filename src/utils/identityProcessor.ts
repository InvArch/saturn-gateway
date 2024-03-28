import * as Kilt from '@kiltprotocol/sdk-js';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { Option } from '@polkadot/types';
import { encodeAddress } from '@polkadot/util-crypto';

import { useRingApisContext } from "../providers/ringApisProvider";
import { WSS_TINKERNET } from './consts';

export enum ImageType {
  URL,
  RMRK,
};

export class IdentityImage {
  private temp: string;
  value: string;
  type: ImageType;

  constructor(value: any, type: ImageType) {
    this.type = type;

    switch (type) {
      case ImageType.URL:
        this.temp = "";
        this.value = value;
        break;

      case ImageType.RMRK:
        const { address, md5 } = value;
        const kusamaAddress = encodeAddress(address, 2);

        const url = `https://singular.app/api/get-identity-images?userId=${ kusamaAddress }&nftMd5Id=${ md5 }&_vercel_no_cache=1`;

        this.temp = url;
        this.value = "";
        break;
    }
  }

  public async set() {
    try {
      switch (this.type) {
        case ImageType.URL:
          break;

        case ImageType.RMRK:
          const response = await fetch(this.temp);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${ response.status }`);
          }
          try {
            // Check if the response's content type is application/json
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
              const json = response.clone();
              const jsonData = await json.json();
              // check if jsonData exists
              if (jsonData) {
                this.value = jsonData.primaryResourceData.metadata.mediaUri;
                this.temp = "";
              }
            } else {
              console.log('Response content type is not application/json');
              this.value = "";
              this.temp = "";
            }
          } catch (error) {
            console.error('An error occurred in jsonData:', error);
          }
      }
    } catch (error) {
      console.error('An error occurred:', error);
    }
  }
};

export enum IdentityServices {
  Web3Name = "Web3Name",
  TinkernetIdentity = "Tinkernet",
  KusamaIdentity = "Kusama",
  PolkadotIdentity = "Polkadot",
};

export type Identity = {
  service: IdentityServices;
  address: string;
  name: string;
  legal?: string;
  image?: IdentityImage;
  twitter?: string;
  discord?: string;
  telegram?: string;
  web?: string;
};

export type AggregatedIdentity = {
  address: string;
  name?: string;
  legal?: string;
  image?: IdentityImage;
  twitter?: string;
  discord?: string;
  telegram?: string;
  web?: string;
  otherIdentities: Identity[];
};

export async function getBestIdentity(address: string): Promise<AggregatedIdentity> {
  const ringApisContext = useRingApisContext();

  // Wrap each identity fetch in a separate try-catch block
  async function safeGetWeb3Name() {
    try {
      return await getWeb3Name(address);
    } catch (error) {
      console.error('Error fetching Web3Name:', error);
      return undefined;
    }
  }

  async function safeGetTinkernetIdentity() {
    try {
      return await getTinkernetIdentity(address, ringApisContext?.state.tinkernet);
    } catch (error) {
      console.error('Error fetching TinkernetIdentity:', error);
      return undefined;
    }
  }

  async function safeGetKusamaIdentity() {
    try {
      return await getKusamaIdentity(address);
    } catch (error) {
      console.error('Error fetching KusamaIdentity:', error);
      return undefined;
    }
  }

  async function safeGetPolkadotIdentity() {
    try {
      return await getPolkadotIdentity(address);
    } catch (error) {
      console.error('Error fetching PolkadotIdentity:', error);
      return undefined;
    }
  }

  // Use the safe functions with Promise.all to handle them concurrently
  const [
    web3Name,
    tinkernetIdentity,
    kusamaIdentity,
    polkadotIdentity
  ] = await Promise.all([
    safeGetWeb3Name(),
    safeGetTinkernetIdentity(),
    safeGetKusamaIdentity(),
    safeGetPolkadotIdentity()
  ]);

  const otherIdentities: Identity[] = [
    web3Name,
    tinkernetIdentity,
    kusamaIdentity,
    polkadotIdentity
  ].filter((i): i is Identity => !!i);

  // Aggregate the results, prioritizing the identities in a specific order
  return {
    address,
    otherIdentities,
    name: web3Name?.name || tinkernetIdentity?.name || polkadotIdentity?.name || kusamaIdentity?.name,
    legal: tinkernetIdentity?.legal || polkadotIdentity?.legal || kusamaIdentity?.legal,
    image: tinkernetIdentity?.image || polkadotIdentity?.image || kusamaIdentity?.image,
    twitter: tinkernetIdentity?.twitter || polkadotIdentity?.twitter || kusamaIdentity?.twitter,
    discord: tinkernetIdentity?.discord || polkadotIdentity?.discord || kusamaIdentity?.discord,
    telegram: tinkernetIdentity?.telegram || polkadotIdentity?.telegram || kusamaIdentity?.telegram,
    web: tinkernetIdentity?.web || polkadotIdentity?.web || kusamaIdentity?.web,
  };
}

async function getWeb3Name(address: string): Promise<Identity | undefined> {
  try {
    await Kilt.connect('wss://kilt-rpc.dwellir.com/');
  } catch (error) {
    console.error('Failed to connect to Kilt Spiritnet:', error);
    throw new Error('Connection to Kilt Spiritnet failed');
  }

  const api = Kilt.ConfigService.get('api');

  try {
    const { web3Name } = Kilt.Did.linkedInfoFromChain(
      await api.call.did.queryByAccount(
        Kilt.Did.accountToChain(address)
      )
    );

    if (web3Name) {
      Kilt.disconnect();

      return {
        address,
        name: `w3n:${ web3Name }`,
        service: IdentityServices.Web3Name,
      };
    } else {
      Kilt.disconnect();

      return;
    }
  } catch (error) {
    console.error('Error fetching web3Name:', error);
    Kilt.disconnect();

    return;
  }
}

async function getKusamaIdentity(address: string): Promise<Identity | undefined> {
  const kusamaApi = await ApiPromise.create({ provider: new WsProvider("wss://kusama-rpc.dwellir.com") });

  const iden = (
    (await kusamaApi.query.identity.identityOf(address))?.toHuman() as {
      info: {
        display: { Raw: string; };
        legal: { Raw: string; };
        image: { Raw: string; };
        twitter: { Raw: string; };
        web: { Raw: string; };
        additional: [{ Raw: string; }, { Raw: string; }][];
      };
    }
  )?.info;

  let image;

  if (iden?.image?.Raw) image = new IdentityImage(iden.image.Raw, ImageType.URL);
  else {
    const maybeRmrkImage = iden?.additional?.find(([key, _]) => key.Raw?.toLowerCase() === "userpic")?.[1].Raw;
    if (maybeRmrkImage) {
      image = new IdentityImage({ md5: maybeRmrkImage, address }, ImageType.RMRK);
      await image.set();
    }
  }

  kusamaApi.disconnect();

  return iden?.display?.Raw ? {
    service: IdentityServices.KusamaIdentity,
    address,
    name: iden.display.Raw,
    legal: iden?.legal?.Raw,
    image,
    twitter: iden?.twitter?.Raw,
    discord: iden?.additional?.find(([key, _]) => key.Raw?.toLowerCase() === "discord")?.[1].Raw,
    telegram: iden?.additional?.find(([key, _]) => key.Raw?.toLowerCase() === "telegram")?.[1].Raw,
    web: iden?.web?.Raw,
  } : undefined;
}

async function getPolkadotIdentity(address: string): Promise<Identity | undefined> {
  const polkadotApi = await ApiPromise.create({ provider: new WsProvider("wss://polkadot-rpc.dwellir.com") });

  const iden = (
    (await polkadotApi.query.identity.identityOf(address))?.toHuman() as {
      info: {
        display: { Raw: string; };
        legal: { Raw: string; };
        image: { Raw: string; };
        twitter: { Raw: string; };
        web: { Raw: string; };
        additional: [{ Raw: string; }, { Raw: string; }][];
      };
    }
  )?.info;

  const image = iden?.image?.Raw ? new IdentityImage(iden.image.Raw, ImageType.URL) : undefined;

  polkadotApi.disconnect();

  return iden?.display?.Raw ? {
    service: IdentityServices.PolkadotIdentity,
    address,
    name: iden.display.Raw,
    legal: iden?.legal?.Raw,
    image,
    twitter: iden?.twitter?.Raw,
    discord: iden?.additional?.find(([key, _]) => key.Raw?.toLowerCase() === "discord")?.[1].Raw,
    telegram: iden?.additional?.find(([key, _]) => key.Raw?.toLowerCase() === "telegram")?.[1].Raw,
    web: iden?.web?.Raw,
  } : undefined;
}

async function getTinkernetIdentity(address: string, ringApi?: ApiPromise): Promise<Identity | undefined> {
  const tinkernetApi = ringApi || await ApiPromise.create({ provider: new WsProvider(WSS_TINKERNET) });

  const iden = (
    (await tinkernetApi.query.identity.identityOf(address))?.toHuman() as {
      info: {
        display: { Raw: string; };
        legal: { Raw: string; };
        image: { Raw: string; };
        twitter: { Raw: string; };
        web: { Raw: string; };
        additional: [{ Raw: string; }, { Raw: string; }][];
      };
    }
  )?.info;

  const image = iden?.image?.Raw ? new IdentityImage(iden.image.Raw, ImageType.URL) : undefined;

  if (!ringApi) tinkernetApi.disconnect();

  return iden?.display?.Raw ? {
    service: IdentityServices.TinkernetIdentity,
    address,
    name: iden.display.Raw,
    legal: iden?.legal?.Raw,
    image,
    twitter: iden?.twitter?.Raw,
    discord: iden?.additional?.find(([key, _]) => key.Raw?.toLowerCase() === "discord")?.[1].Raw,
    telegram: iden?.additional?.find(([key, _]) => key.Raw?.toLowerCase() === "telegram")?.[1].Raw,
    web: iden?.web?.Raw,
  } : undefined;
}
