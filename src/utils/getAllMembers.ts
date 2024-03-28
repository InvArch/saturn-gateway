import { Saturn } from '@invarch/saturn-sdk';
import { MembersType } from "../pages/Management";
import BigNumber from 'bignumber.js';

export async function getAllMembers(multisigId: number, saturn: Saturn) {
  if (typeof multisigId !== 'number' || !saturn) {
    console.error('Invalid multisigId or saturn instance');
    return [];
  }

  let mems;
  try {
    mems = await saturn.getMultisigMembers(multisigId);
  } catch (error) {
    console.error('Failed to get multisig members', error);
    return [];
  }

  const memsProcessedPromise = mems.map(async (m) => {
    let votes;
    try {
      votes = BigNumber((await saturn.getMultisigMemberBalance({ id: multisigId, address: m })).toString());
    } catch (error) {
      console.error('Failed to get multisig member balance', error);
      votes = new BigNumber(0);
    }
    return {
      address: m.toHuman(),
      votes,
    };
  });

  let memsProcessed: MembersType[];
  try {
    memsProcessed = await Promise.all(memsProcessedPromise);
  } catch (error) {
    console.error('Failed to process members', error);
    return [];
  }

  return memsProcessed;
};