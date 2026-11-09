
'use strict';

// NASA Space Explorer — PWA Features

document.addEventListener('DOMContentLoaded', () => {
  const offlineIndicator =
    document.getElementById('offlineIndicator');

  const installButton =
    document.getElementById('installApp');

  const notificationButton =
    document.getElementById('enableNotifications');

  const pwaMessage =
    document.getElementById('pwaMessage');

  let deferredInstallPrompt = null;

  function showMessage(message) {
    if (!pwaMessage) return;

    pwaMessage.textContent = message;
    pwaMessage.hidden = false;
  }

  // Register the service worker.
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        await navigator.serviceWorker.register('./sw.js');

        console.log('NASA service worker registered.');
      } catch (error) {
        console.error(
          'Service worker registration failed:',
          error
        );
      }
    });

    // Listen for cached NASA API data notifications.
    navigator.serviceWorker.addEventListener(
      'message',
      event => {
        if (event.data?.type === 'NASA_OFFLINE_DATA') {
          showMessage(event.data.message);
        }
      }
    );
  }

  // Online/offline status indicator.
  function updateConnectionStatus() {
    if (!offlineIndicator) return;

    offlineIndicator.hidden = navigator.onLine;

    if (!navigator.onLine) {
      offlineIndicator.textContent =
        'You are offline. Previously viewed NASA data may still be available.';
    }
  }

  window.addEventListener(
    'online',
    updateConnectionStatus
  );

  window.addEventListener(
    'offline',
    updateConnectionStatus
  );

  updateConnectionStatus();

  // Capture the browser's install prompt.
  window.addEventListener(
    'beforeinstallprompt',
    event => {
      event.preventDefault();

      deferredInstallPrompt = event;

      if (installButton) {
        installButton.hidden = false;
      }
    }
  );

  // Detect whether the app is already installed.
  function isStandalone() {
    return (
      window.matchMedia(
        '(display-mode: standalone)'
      ).matches ||
      window.navigator.standalone === true
    );
  }

  function isIOS() {
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (
        navigator.platform === 'MacIntel' &&
        navigator.maxTouchPoints > 1
      )
    );
  }

  if (installButton && isIOS() && !isStandalone()) {
    installButton.hidden = false;
  }

  // Custom installation button.
  installButton?.addEventListener('click', async () => {
    if (isStandalone()) {
      showMessage('NASA Explorer is already installed.');
      return;
    }

    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();

      const choice =
        await deferredInstallPrompt.userChoice;

      if (choice.outcome === 'accepted') {
        showMessage(
          'Installation accepted! Check your device.'
        );

        installButton.hidden = true;
      } else {
        showMessage(
          'Installation cancelled. You can try again later.'
        );
      }

      deferredInstallPrompt = null;
      return;
    }

    if (isIOS()) {
      showMessage(
        'On iPhone, open this page in Safari, tap Share, then select Add to Home Screen.'
      );
      return;
    }

    showMessage(
      'Use your browser menu and choose Install App or Add to Home Screen.'
    );
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;

    if (installButton) {
      installButton.hidden = true;
    }

    showMessage('NASA Space Explorer was installed!');
  });

  // Request notification permission on user click.
  notificationButton?.addEventListener(
    'click',
    async () => {
      if (!('Notification' in window)) {
        showMessage(
          'Notifications are not supported in this browser.'
        );
        return;
      }

      try {
        const permission =
          await Notification.requestPermission();

        if (permission === 'granted') {
          showMessage(
            'Notification permission granted!'
          );
        } else if (permission === 'denied') {
          showMessage(
            'Notification permission was denied.'
          );
        } else {
          showMessage(
            'Notification permission was not granted.'
          );
        }
      } catch (error) {
        console.error(error);

        showMessage(
          'Unable to request notification permission.'
        );
      }
    }
  );
});
