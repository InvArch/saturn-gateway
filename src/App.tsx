import type { Component } from 'solid-js';
import { createEffect, createMemo, createSignal, lazy, on, onCleanup, onMount } from 'solid-js';
import { Routes, Route, useNavigate } from '@solidjs/router';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { Saturn } from '@invarch/saturn-sdk';
import { Rings } from './data/rings';
import { Proposal, ProposalType, ProposeProvider, useProposeContext } from "./providers/proposeProvider";
import { WalletConnectProvider, useWalletConnectContext } from "./providers/walletConnectProvider";
import { useRingApisContext, RingApisProvider } from "./providers/ringApisProvider";
import { useSaturnContext, SaturnProvider } from "./providers/saturnProvider";
import { useSelectedAccountContext, SelectedAccountProvider } from "./providers/selectedAccountProvider";
import { IdentityProvider } from "./providers/identityProvider";
import Layout from './components/legos/Layout';
import { ThemeProvider } from './providers/themeProvider';
import MainContainer from './components/center-main/MainContainer';
import Home from './pages/Home';
import { u8aToHex, hexToU8a } from '@polkadot/util';
import { decodeAddress } from '@polkadot/util-crypto';
import { Core } from '@walletconnect/core';
import { Web3WalletTypes, IWeb3Wallet, Web3Wallet } from '@walletconnect/web3wallet';
import { setupSaturnConnect } from './utils/setupSaturnConnect';
import { WC_PROJECT_ID, WalletNameEnum } from './utils/consts';
import { POLKADOT_CHAIN_ID, WalletConnectConfiguration, WalletConnectProvider as WcProvider, WalletAggregator, InjectedWalletProvider, toWalletAccount, WcAccount } from './lnm/wallet-connect';
import type { SessionTypes, SignClientTypes } from '@walletconnect/types';

const Create = lazy(async () => import('./pages/Create'));

export const CHAIN_IDS = "polkadot:d42e9606a995dfe433dc7955dc2a70f4";

const injectedWalletProvider = new InjectedWalletProvider({}, 'Saturn Gateway');

const walletConnectParams: WalletConnectConfiguration = {
  projectId: WC_PROJECT_ID,
  relayUrl: 'wss://relay.walletconnect.com',
  metadata: {
    name: 'Saturn Gateway',
    description: 'Saturn Gateway',
    url: 'https://invarch.network',
    icons: [
      'https://www.icon-stories.ch/quizzes/media/astronomy/images/ringed-planet.png',
    ],
  },
  chainIds: [CHAIN_IDS],
};

const wcProvider = new WcProvider(walletConnectParams, "Saturn Gateway");

export const walletAggregator = new WalletAggregator([
  injectedWalletProvider, wcProvider]);

const HomePlanet: Component = () => {
  const [wcOptions, setWcOptions] = createSignal<Web3WalletTypes.Options | undefined>(undefined);
  const [wcActiveSessions, setWcActiveSessions] = createSignal<
    Array<[string, SessionTypes.Struct]>
  >([]);
  const ringApisContext = useRingApisContext();
  const saturnContext = useSaturnContext();
  const selectedAccountContext = useSelectedAccountContext();
  const proposeContext = useProposeContext();
  const wcContext = useWalletConnectContext();
  const navigate = useNavigate();
  const saturnStateMemo = createMemo(() => saturnContext.state);
  const isLoggedIn = createMemo(() => !!selectedAccountContext.state.account?.address);
  const isHomepage = createMemo(() => location.pathname === '/');
  const getDefaultMultisigId = createMemo(() => {
    // return undefined if no multisigs
    if (!saturnContext.state.multisigItems || saturnContext.state.multisigItems.length === 0) {
      return undefined;
    }

    const defaultMultisigId = saturnContext.state.multisigItems[0].id;
    return defaultMultisigId;
  });
  const getSelectedStorage = createMemo(() => selectedAccountContext.setters.getSelectedStorage());

  const createApis = async (): Promise<Record<string, ApiPromise>> => {
    const entries: Array<Promise<[string, ApiPromise]>> = Object.entries(Rings).map(
      async ([chain, data]) => {
        const res: [string, ApiPromise] = [
          chain,
          await ApiPromise.create({
            provider: new WsProvider(data.websocket),
          }),
        ];

        return res;
      },
    );

    return Object.fromEntries(await Promise.all(entries));
  };

  const sessionProposalCallback = async (proposal: Web3WalletTypes.SessionProposal, w3w: IWeb3Wallet) => {
    console.log('session_proposal: ', proposal);
    const address = saturnStateMemo().multisigAddress;
    if (address) {
      await w3w.approveSession({
        id: proposal.id,
        namespaces: {
          polkadot: {
            accounts: [`${ POLKADOT_CHAIN_ID }:${ address }`],
            methods: ['polkadot_signTransaction', 'polkadot_signMessage'],
            chains: [POLKADOT_CHAIN_ID],
            events: [],
          },
        },
      });
    }
  };

  const sessionRequestCallback = async (event: Web3WalletTypes.SessionRequest, w3w: IWeb3Wallet) => {
    console.log('session_request: ', event);
    const address = saturnStateMemo().multisigAddress;
    if (!address) return;

    const { topic, params, id } = event;
    const { request } = params;
    const requestedTx = request.params;
    const chainId = params.chainId;

    if (
      u8aToHex(decodeAddress(requestedTx.address))
      != u8aToHex(decodeAddress(address))
    ) {
      console.log('accounts don\'t match');
      console.log(requestedTx.address, address);
      console.log(
        u8aToHex(decodeAddress(requestedTx.address)),
        u8aToHex(decodeAddress(address)),
      );
    } else {
      const chain = Object.entries(Rings).find(([_, value]) => value.wcNamespace == chainId)?.[0];

      console.log("chain: ", chain);

      if (!chain) return;

      const proposalType = chain === "tinkernet" ? ProposalType.LocalCall : ProposalType.XcmCall;

      proposeContext.setters.openProposal(
        new Proposal(proposalType, { chain, encodedCall: hexToU8a(requestedTx.transactionPayload.method) })
      );

      const response = {
        id,
        error: { code: 42069, message: 'Proposed to multisig.' },
        jsonrpc: '2.0',
      };

      if (topic && response) {
        await w3w.respondSessionRequest({ topic, response });
      }
    }
  };

  onMount(() => {
    const runAsync = async () => {
      const apis = await createApis();
      if (apis.tinkernet) {
        ringApisContext.setters.setRingApisBatch(apis);

        const sat = new Saturn({ api: apis.tinkernet });
        saturnContext.setters.setSaturn(sat);
      }
    };
    runAsync();
  });

  onMount(() => {
    // Set Wallet Connect Core which includes Saturn's projectId
    const core = new Core({
      projectId: WC_PROJECT_ID,
    });
    if (!!core) {
      const options: Web3WalletTypes.Options = {
        core,
        metadata: {
          name: 'Saturn Gateway',
          description: 'Saturn Gateway Multisig',
          url: 'https://invarch.network',
          icons: [
            'https://www.icon-stories.ch/quizzes/media/astronomy/images/ringed-planet.png',
          ],
        },
      };
      setWcOptions(options);
    }
  });

  createEffect(() => {
    // Init contexts for Saturn Connect
    setupSaturnConnect(saturnContext, proposeContext);
  });

  createEffect(() => {
    // Set session proposal and request callbacks for WalletConnect
    let timeout: any;
    const runAsync = async () => {
      try {
        const options = wcOptions();
        if (!options) return;

        const w3w = await Web3Wallet.init(options);
        timeout = setTimeout(() => {
          if (wcContext.setters.setWalletConnect && !!w3w) {
            wcContext.setters.setWalletConnect(w3w, (proposal: Web3WalletTypes.SessionProposal) => sessionProposalCallback(proposal, w3w), (request: Web3WalletTypes.SessionRequest) => sessionRequestCallback(request, w3w));
          }
        }, 100);
      } catch (error) {
        console.error(error);
      }
    };

    runAsync();

    onCleanup(() => {
      clearTimeout(timeout);
    });
  });

  createEffect(on(() => wcContext.state.w3w, () => {
    const getSelectedStorage = () => selectedAccountContext.setters.getSelectedStorage();

    const runAsync = async () => {
      const current = getSelectedStorage();
      // Get all available accounts
      if (current && walletAggregator) {
        const { address, wallet } = current;
        const matchedWallet = walletAggregator.getWallets().find((w) => {
          // Handle WalletConnect id differently
          if (wallet === WalletNameEnum.WALLETCONNECT) {
            return w.metadata.id === wallet;
          } else {
            return w.metadata.title === wallet;
          }
        });

        if (matchedWallet) {
          // prevent certain wallets from connecting
          if (matchedWallet.metadata.id !== WalletNameEnum.CRUSTWALLET &&
            matchedWallet.metadata.id !== WalletNameEnum.WALLETCONNECT &&
            matchedWallet.metadata.id !== WalletNameEnum.SPORRAN) {
            await matchedWallet.connect();
          }

          if (matchedWallet.metadata && matchedWallet.metadata.id === WalletNameEnum.WALLETCONNECT) {
            // If WalletConnect, check for last active session and autoConnect
            const client = wcContext.state.w3w;
            if (!client) return;
            const sessions = client.getActiveSessions();
            const selectedAddress = getSelectedStorage().address;
            const lastKnownSession = Object.entries(sessions).find((s) => {
              const sessionAddress = toWalletAccount(s[1].namespaces?.polkadot?.accounts?.[0] as WcAccount).address;
              return sessionAddress === selectedAddress;
            });
            if (lastKnownSession) {
              const expireDate = new Date(lastKnownSession[1].expiry * 1000);
              const now = new Date();
              if (now < expireDate && lastKnownSession[1].acknowledged) {
                // autoConnect to last known session on browser refresh
                if (!matchedWallet.isConnected() && !!matchedWallet.autoConnect) {
                  await matchedWallet.autoConnect();
                  console.log('autoConnected from lastSession');
                }
              } else {
                matchedWallet.disconnect();
              }
            } else {
              console.error('lastKnownSession not found');
            }
          }

          const matchedAddress = (await matchedWallet.getAccounts()).find((a) => a.address == address);
          if (matchedAddress) {
            selectedAccountContext.setters.setSelected(matchedAddress, matchedWallet);
          }
        }
      }
    };

    runAsync();
  }));

  createEffect(on(() => isLoggedIn, () => {
    // if logged in and on homepage, redirect to multisig members page
    if (isLoggedIn()) {
      if (!!getDefaultMultisigId() && isHomepage()) {
        navigate(`/${ getDefaultMultisigId() }/members`, { resolve: false });
        return;
      }
    }
  }));

  return (
    <Layout>
      <Routes>
        <Route path="/" component={Home} />
        <Route path="/create" component={Create} />
        <Route path='/:idOrAddress/*' component={MainContainer} />
      </Routes>
    </Layout>
  );
};

const App = () => (
  <ProposeProvider>
    <SaturnProvider>
      <RingApisProvider>
        <WalletConnectProvider>
          <SelectedAccountProvider>
            <IdentityProvider>
              <ThemeProvider>
                <HomePlanet />
              </ThemeProvider>
            </IdentityProvider>
          </SelectedAccountProvider>
        </WalletConnectProvider>
      </RingApisProvider>
    </SaturnProvider>
  </ProposeProvider>
);

export default App;
