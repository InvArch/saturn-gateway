// if div with attribute modal-backdrop is null, remove it from the DOM
export default function removeBackrops() {
  function removeBackdrop() {
    const backdrops = document.querySelectorAll('[modal-backdrop]');
    if (backdrops.length > 0) {
      backdrops.forEach((backdrop) => {
        if (backdrop !== null) {
          backdrop.remove();
        } else {
          return;
        }
      });
    }
  }

  // Check if the DOM is ready before removing the backdrop
  if (document.readyState === 'loading') {
    // console.log('DOM is loading');
    document.addEventListener('DOMContentLoaded', removeBackdrop);
  } else {
    removeBackdrop();
  }

  // Remove the event listener on beforeunload to prevent memory leaks
  window.addEventListener('beforeunload', () => {
    // console.log('removed backdrop event listener!');
    document.removeEventListener('DOMContentLoaded', removeBackdrop);
  });

  // Remove backdrop when clicking outside the modal
  document.addEventListener('click', (event) => {
    const modalElement = document.getElementById('walletAccountsModal');
    if (modalElement && !modalElement.contains(event.target)) {
      removeBackdrop();
    }
  });
}

// Call the removeBackrops function to trigger the removal of the backdrop
removeBackrops();