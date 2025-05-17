document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.querySelector('.menu-toggle');
    const menu = document.querySelector('.menu');

    if (menuToggle && menu) {
        menuToggle.addEventListener('click', () => {
            menu.classList.toggle('show');
        });
    }

    updateConnectionStatus();

    window.addEventListener('online', updateConnectionStatus);
    window.addEventListener('offline', updateConnectionStatus);
});

function updateConnectionStatus() {
    const statusElement = document.getElementById('connection-status');
    if (statusElement) {
        if (navigator.onLine) {
            statusElement.textContent = 'Połączono z internetem';
            statusElement.className = 'online';
        } else {
            statusElement.textContent = 'Brak połączenia z internetem (tryb offline)';
            statusElement.className = 'offline';
        }
    }

    const offlineMessage = document.getElementById('offline-message');
    if (offlineMessage) {
        if (!navigator.onLine) {
            offlineMessage.classList.remove('hidden');
        } else {
            offlineMessage.classList.add('hidden');
        }
    }
}
