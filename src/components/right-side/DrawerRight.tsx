import RightContent from "./RightContent";

const DrawerRight = () => {
  return <div id="rightSidebar" class="fixed top-0 right-0 z-[60] w-full md:w-auto h-full overflow-y-scroll transition-transform -translate-x-full bg-saturn-offwhite dark:bg-saturn-black">
    <button type="button" data-drawer-hide="rightSidebar" aria-controls="rightSidebar" class="text-gray-400 bg-transparent hover:bg-purple-200 hover:text-gray-900 rounded-lg text-sm p-1.5 absolute top-2.5 right-2.5 inline-flex items-center dark:hover:bg-purple-800 dark:hover:text-white">
      <svg aria-hidden="true" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
      <span class="sr-only">Close menu</span>
    </button>
    <div class="mt-10">
      <RightContent inDrawer={true} />
    </div>
  </div>;
};

DrawerRight.displayName = 'DrawerRight';
export default DrawerRight;