import { createContext, useContext, createResource, JSX, createMemo, createSignal, createEffect, on } from "solid-js";
import { getBestIdentity, type AggregatedIdentity } from "../utils/identityProcessor";
import { createLocalStorage } from "@solid-primitives/storage";
import { createStore } from "solid-js/store";
import { useSaturnContext } from "./saturnProvider";
import { getAllMembers } from "../utils/getAllMembers";

export type IdentityContextType = {
  state: {
    identities?: AggregatedIdentity[];
  },
  actions: {
    getIdentities: (refresh?: boolean) => void,
    clearIdentities: () => void,
  },
};

const IdentityContext = createContext<IdentityContextType>();

const initialIdentity: AggregatedIdentity = {
  address: "",
  otherIdentities: [],
};

export function IdentityProvider(props: { children: JSX.Element; }) {
  const saturnContext = useSaturnContext();

  const satState = createMemo(() => saturnContext.state);
  const id = createMemo(() => satState().multisigId);
  const sat = createMemo(() => satState().saturn);

  const [addresses, setAddresses] = createSignal<string[]>([]);
  const [identities, setIdentities] = createStore<AggregatedIdentity[]>([]);
  const [storageState, setStorageState, { remove }] = createLocalStorage<AggregatedIdentity[]>();

  createEffect(() => {
    const multisigId = id();
    const saturn = sat();

    const getMemberAddresses = async () => {
      if (!Number.isNaN(multisigId) && saturn) {
        const members = await getAllMembers(multisigId!, saturn);
        const addresses = members.map((m) => m.address);
        setAddresses(addresses);
      } else {
        console.error('multisigId or saturn not found');
      }
    };

    getMemberAddresses();
  });

  const [allIdentities, { refetch }] = createResource(addresses, async () => {
    const addrs = addresses();
    if (addrs.length === 0) {
      console.log('no addresses available to parse identities');
      return [];
    }
    return Promise.all(addrs.map(addr => getBestIdentity(addr)));
  });

  const getIdentities = async (refresh?: boolean) => {
    if (refresh) {
      await refetch();
    }

    const allIds = allIdentities();
    const identitiesFromResource = allIds;
    if (identitiesFromResource && identitiesFromResource.length > 0) {
      setIdentities(identitiesFromResource);
      setStorageState('identities', JSON.stringify(identitiesFromResource));
    } else {
      const identitiesFromStorage = storageState['identities'];
      if (identitiesFromStorage) {
        const parsedIdentities = JSON.parse(identitiesFromStorage);
        if (parsedIdentities && Array.isArray(parsedIdentities)) {
          setIdentities(parsedIdentities);
        }
      }
    }
  };

  const clearIdentities = () => {
    remove('identities');
    setIdentities([]);
  };

  const value = createMemo(() => ({
    state: { identities },
    actions: {
      getIdentities,
      clearIdentities,
    },
  }));

  createEffect(() => {
    getIdentities();
  });

  return (
    <IdentityContext.Provider value={value()}>
      {props.children}
    </IdentityContext.Provider>
  );
}

export function useIdentityContext() {
  const context = useContext(IdentityContext);

  if (!context) {
    throw new Error("useIdentityContext: cannot find an IdentityContext");
  }

  return context;
}