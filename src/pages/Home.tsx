import { createMemo, createSignal } from 'solid-js';
import { useThemeContext } from '../providers/themeProvider';
import ColorSwitch from '../components/left-side/ColorSwitch';
import { useSelectedAccountContext } from '../providers/selectedAccountProvider';
import { useNavigate } from '@solidjs/router';
import { useSaturnContext } from '../providers/saturnProvider';
import { walletAggregator } from '../App';
import { Account, WalletType } from '@polkadot-onboard/core';

const Home = () => {
  const [isHovered, setHovered] = createSignal(false);

  const theme = useThemeContext();
  const nav = useNavigate();
  const saturnContext = useSaturnContext();
  const selectedAccount = useSelectedAccountContext();

  const isLightTheme = createMemo(() => theme.getColorMode() === 'light');
  const multisigId = createMemo(() => saturnContext.state.multisigId);

  const selectDefaultAccount = async () => {
    const allWallets = await walletAggregator.getWallets();
    let newAccounts: (Account & { title?: string; })[] = [];

    for (const wallet of allWallets) {
      if (!wallet || typeof wallet.getAccounts !== 'function') {
        console.error('wallet is not valid or getAccounts is not a function');
        continue;
      }

      if (wallet.type !== WalletType.WALLET_CONNECT) {
        try {
          await wallet.connect();
        } catch (error) {
          console.error('connect error: ', error);
          continue;
        }
      }

      try {
        let availAccounts: Account[] & { title?: string; } = await wallet.getAccounts();
        availAccounts = availAccounts.map(account => ({
          title: wallet.metadata.title,
          name: wallet.metadata.title,
          ...account
        }));
        // Ensure accounts are unique
        availAccounts = availAccounts.filter((account, index, self) =>
          self.findIndex(a => a.address === account.address) === index
        );
        newAccounts.push(...availAccounts); // Accumulate accounts
      } catch (error) {
        console.error('getAccounts error: ', error);
      }
    }

    if (newAccounts.length > 0) {
      const defaultAccount = newAccounts[0];
      selectedAccount.setters.setSelected(defaultAccount, allWallets.find(w => w.metadata.title === defaultAccount.title));
    }
  };

  const enterGateway = async () => {
    const id = multisigId();
    setHovered(true);

    try {
      if (!!id) {
        nav(`/${ id }/assets`);
      } else {
        console.error('No multisig id found');
        nav(`${ undefined }/assets`);
      }
    } catch (error) {
      console.error(error);
    }
    // finally {
    //   selectDefaultAccount();
    // }
  };

  // createEffect(() => {
  //   cleanup(); // Clean up the previous scene

  //   const scene = new Scene();
  //   scene.background = isLightTheme() ? new Color(0xF9F9FB) : new Color(0x000000); // Set bg color

  //   const renderer = new WebGLRenderer();
  //   renderer.setSize(window.innerWidth, window.innerHeight);

  //   const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  //   camera.position.z = 5;

  //   const vertices = [];
  //   for (let i = 0; i < 10000; i++) {
  //     vertices.push(
  //       MathUtils.randFloatSpread(2000), // x
  //       MathUtils.randFloatSpread(2000), // y
  //       MathUtils.randFloatSpread(2000)  // z
  //     );
  //   }

  //   const starsGeometry = new BufferGeometry();
  //   starsGeometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));

  //   const starsMaterial = new PointsMaterial({
  //     color: isLightTheme() ? 0x888893 : 0xF9F9FB, // Set stars color based on theme
  //     size: Math.random() * 2.3,
  //     sizeAttenuation: true,
  //   });

  //   const starField = new Points(starsGeometry, starsMaterial);
  //   scene.add(starField);

  //   const animate = () => {
  //     requestAnimationFrame(animate);
  //     starField.rotation.x += 0.001;
  //     starField.rotation.y += 0.001;
  //     renderer.render(scene, camera);
  //   };

  //   container()?.appendChild(renderer.domElement);
  //   animate();

  //   cleanup = () => {
  //     container()?.removeChild(renderer.domElement);
  //     renderer.dispose();
  //     scene.remove(starField);
  //     starsMaterial.dispose();
  //     starsGeometry.dispose();
  //   };
  // });

  return (
    <div class="relative">
      {/* <div ref={setContainer} class="absolute" /> */}
      <div class="fixed left-[-50%] top-[-50%] overflow-hidden h-[200%] w-[200%]">
        <div class="rotate-background" />
        <div class="rotate-background2" />
      </div>
      <div id="planetContainer" />
      <div class="flex items-center justify-center text-center translate-y-[25%] md:translate-y-[50%]">
        <div class="flex flex-col justify-center items-around inset-0 text-center">
          <h1 class="text-4xl/none md:text-5xl/none lg:text-6xl/none h-auto lg:h-32 font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ECD92F] via-[#FF4D90] to-[#692EFF]">One Multisig.<br />
            Any Blockchain.
          </h1>
          <h2 class={`${ !isLightTheme() ? 'text-white' : 'text-black' } text-md md:text-xl lg:text-2xl mb-5 mt-2`}>Welcome to the future of asset management.</h2>
          <p class={`${ !isLightTheme() ? 'text-white' : 'text-black' } text-sm/tight w-[80%] md:w-2/3 px-10 block text-center mx-auto`}>A multichain multisig secured by Polkadot that can manage assets across any blockchain.</p>
          <button
            id="enter"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onTouchStart={() => setHovered(true)}
            onTouchEnd={() => setHovered(false)}
            onClick={enterGateway}
            class="z-20 relative my-5 p-0.5 overflow-hidden text-sm font-bold w-1/2 md:w-1/3 mx-auto rounded-md group bg-gradient-to-r from-[#ECD92F] via-[#FF4D90] to-[#692EFF] focus:outline-none focus:ring-saturn-purple dark:focus:ring-saturn-purple hover:text-black">
            <span class="w-full h-14 flex items-center justify-center block mx-auto transition-all ease-in duration-75 bg-white dark:bg-black rounded-md group-hover:bg-opacity-0">
              <span class={`${ !isHovered() ? 'text-transparent bg-clip-text bg-gradient-to-r from-[#ECD92F] via-[#FF4D90] to-[#692EFF]' : 'text-black' } visited:text-black`}>Enter the Omniway</span>
            </span>
          </button>
          <ColorSwitch />
        </div>
      </div>
    </div>
  );
};

export default Home;