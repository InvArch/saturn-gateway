import { NetworkEnum } from "./consts";

let lastRequestTime: number | null = null;
const requestInterval = 2000;

async function fetchData(url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error("Error fetching data:", error);
    return null;
  }
}

export async function getCurrentUsdPrice(network: NetworkEnum) {
  const now = Date.now();
  if (lastRequestTime && now - lastRequestTime < requestInterval) {
    console.log("Request rate limited");
    return null;
  }

  lastRequestTime = now;

  if (!network || network === NetworkEnum.ASSETHUB) return null;

  let data;

  try {
    const apiUrl = `https://api.coingecko.com/api/v3/coins/${ network }?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;

    const responseData = await fetchData(apiUrl);
    if (responseData) {
      data = responseData;
    } else {
      console.error("Empty response data");
      return null;
    }
  } catch (error) {
    console.log("Error fetching data:", error);
    return null;
  }

  return data;
}

export async function getAllUsdPrices(): Promise<Record<NetworkEnum, { usd: string; }> | null> {
  const networks = Object.values(NetworkEnum);
  const filteredNetworks = networks.filter(network => network !== NetworkEnum.ASSETHUB);
  const now = Date.now();

  if (lastRequestTime && now - lastRequestTime < requestInterval) {
    console.log("Request rate limited");
    return null;
  }

  lastRequestTime = now;

  if (!filteredNetworks) return null;

  let data;

  try {
    const apiUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${ filteredNetworks.join(',') }&vs_currencies=usd`;

    const responseData = await fetchData(apiUrl);
    if (responseData) {
      data = responseData;
    } else {
      console.error("Empty response data");
      return null;
    }
  } catch (error) {
    console.log("Error fetching data:", error);
    return null;
  }

  return data;
}
