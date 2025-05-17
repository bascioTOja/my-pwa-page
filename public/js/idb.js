const DB_NAME = 'pwaFormDB';
const DB_VERSION = 1;
const STORE_NAME = 'formData';
let db;

function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                store.createIndex('name', 'name', { unique: false });
                store.createIndex('email', 'email', { unique: false });
            }
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('Baza danych otwarta pomyślnie');
            resolve(db);
        };

        request.onerror = (event) => {
            console.error('Błąd podczas otwierania bazy danych:', event.target.error);
            reject(event.target.error);
        };
    });
}

function addFormData(formData) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        formData.timestamp = new Date().toISOString();

        const request = store.add(formData);

        request.onsuccess = (event) => {
            console.log('Dane zapisane pomyślnie');
            resolve(event.target.result);
        };

        request.onerror = (event) => {
            console.error('Błąd podczas zapisywania danych:', event.target.error);
            reject(event.target.error);
        };
    });
}

function getAllFormData() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);

        const request = store.getAll();

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        request.onerror = (event) => {
            console.error('Błąd podczas pobierania danych:', event.target.error);
            reject(event.target.error);
        };
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('user-form');
    const statusMessage = document.getElementById('form-status');
    const loadDataBtn = document.getElementById('load-data');
    const entriesList = document.getElementById('entries-list');

    openDatabase();

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = {
                name: form.elements['name'].value,
                email: form.elements['email'].value,
                phone: form.elements['phone'].value,
                message: form.elements['message'].value
            };

            try {
                await addFormData(formData);
                statusMessage.textContent = 'Dane zostały zapisane pomyślnie!';
                statusMessage.className = 'status-message success';
                form.reset();

                loadStoredData();
            } catch (error) {
                statusMessage.textContent = `Błąd: ${error.message}`;
                statusMessage.className = 'status-message error';
            }
        });
    }

    if (loadDataBtn) {
        loadDataBtn.addEventListener('click', loadStoredData);
    }

    async function loadStoredData() {
        if (!entriesList) return;

        try {
            const data = await getAllFormData();
            entriesList.innerHTML = '';

            if (data.length === 0) {
                entriesList.innerHTML = '<p>Brak zapisanych danych.</p>';
                return;
            }

            data.forEach(entry => {
                const entryDiv = document.createElement('div');
                const date = new Date(entry.timestamp).toLocaleString();

                entryDiv.innerHTML = `
                    <h3>${entry.name}</h3>
                    <p>Email: ${entry.email}</p>
                    <p>Telefon: ${entry.phone || '-'}</p>
                    <p>Wiadomość: ${entry.message || '-'}</p>
                    <p><small>Data: ${date}</small></p>
                `;

                entriesList.appendChild(entryDiv);
            });
        } catch (error) {
            console.error('Błąd podczas ładowania danych:', error);
            entriesList.innerHTML = `<p class="error">Błąd podczas ładowania danych: ${error.message}</p>`;
        }
    }
});
