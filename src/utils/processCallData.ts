import { Call } from "@polkadot/types/interfaces";
import { AnyJson } from "@polkadot/types/types";

export function processCallData(call: Call, ringApisContext: any): Call {
  if (call.method === "sendCall") {
    const chain = (call.toHuman().args as Record<string, AnyJson>).destination?.toString().toLowerCase();
    const innerCall = (call.toHuman().args as Record<string, AnyJson>).call?.toString();

    if (!chain || !innerCall || !ringApisContext.state[chain]) {
      return call;
    }

    return ringApisContext.state[chain].createType('Call', innerCall) as unknown as Call;
  } else {
    return call;
  }
};