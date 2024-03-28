import { ProposalType } from "../providers/proposeProvider";
import { NetworkEnum } from "./consts";

type ProposalTypeProps = {
  fromChain: string;
  toChain: string;
};

export default function getProposalType(props: ProposalTypeProps): ProposalType {
  const { fromChain, toChain } = props;

  if (!fromChain && !toChain) {
    return ProposalType.LocalCall;
  }

  if (fromChain && !toChain) {
    return ProposalType.XcmCall;
  }

  if ((fromChain === NetworkEnum.TINKERNET && toChain !== NetworkEnum.TINKERNET) || (fromChain !== NetworkEnum.TINKERNET && fromChain === toChain)) {
    return ProposalType.XcmTransfer;
  }

  if (fromChain === NetworkEnum.TINKERNET && toChain === NetworkEnum.TINKERNET) {
    return ProposalType.LocalTransfer;
  }

  if (fromChain !== NetworkEnum.TINKERNET && fromChain !== toChain) {
    return ProposalType.XcmBridge;
  }

  return ProposalType.LocalCall;
}