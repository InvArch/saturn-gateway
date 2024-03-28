import * as Kilt from '@kiltprotocol/sdk-js';

export async function isValidKiltWeb3Name(web3Name: string) {
  const peregrine = 'wss://peregrine.kilt.io/'; // KILT development
  // const spiritnet = 'wss://spiritnet.kilt.io/'; // KILT production
  const spiritnet = 'wss://kilt-rpc.dwellir.com/'; // KILT production

  let returnAddress = '';
  try {
    if (web3Name.trim() !== '') {
      await Kilt.connect(spiritnet);
      const api = Kilt.ConfigService.get('api');
      const encodedDid = await api.call.did.queryByWeb3Name(web3Name);
      if (encodedDid !== null) {
        const linkedInfo = Kilt.Did.linkedInfoFromChain(encodedDid as unknown as any, 117);
        returnAddress = linkedInfo.accounts[0];
      }
    }
  } catch (error) {
    console.error(web3Name + ' does not exist!');
  } finally {
    await Kilt.disconnect();
  }
  return Promise.resolve(returnAddress);
}