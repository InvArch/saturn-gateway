import { BN, hexToU8a } from '@polkadot/util';

import { Rings } from "../data/rings";
import { type SaturnContextType } from "../providers/saturnProvider";
import { type ProposeContextType, ProposalType, Proposal } from "../providers/proposeProvider";

declare global {
    interface Window {
        saturnConnect: {
            sendMultisigData: (multisigData: { name: string; address: string }) => void;
        }
    }
}

export function setupSaturnConnect(saturnContext: SaturnContextType, proposeContext: ProposeContextType) {
    window.addEventListener('message', ({ data, source }) => {

        if (data.type === "IN_GATEWAY" && data.text === "sign_payload") {
            console.log("received payload to propose: ", data.payload);

            if (!saturnContext.state.saturn || !saturnContext.state.multisigId) return;

            if (data.payload.genesisHash === Rings.tinkernet.genesisHash) {
                proposeContext.setters.openProposeModal(
                    new Proposal(ProposalType.LocalCall, { chain: "tinkernet", encodedCall: hexToU8a(data.payload.method) })
                );
            } else {
                const chain = Object.entries(Rings).find(([chain, ringData]) => ringData.genesisHash === data.payload.genesisHash)?.[0];

                if (!chain) return;

                proposeContext.setters.openProposeModal(
                    new Proposal(ProposalType.XcmCall, { chain, encodedCall: hexToU8a(data.payload.method) })
                );
            }

        }
    });
}

export function setSaturnConnectAccount(name: string, address: string) {
    window.saturnConnect.sendMultisigData({ name, address });
}
