const API_CACHE_NAME = 'advice-cache-v1';

document.addEventListener('DOMContentLoaded', () => {
    const getAdviceBtn = document.getElementById('get-advice');
    const adviceContainer = document.getElementById('advice-container');
    const searchAdviceBtn = document.getElementById('search-advice');
    const searchInput = document.getElementById('advice-query');
    const searchResultsContainer = document.getElementById('advice-search-results');

    if (getAdviceBtn && adviceContainer) {
        getAdviceBtn.addEventListener('click', () => {
            getRandomAdvice()
                .then(data => displayAdvice(data, adviceContainer))
                .catch(error => {
                    adviceContainer.innerHTML = `
                        <div class="advice-card error">
                            <p>Błąd podczas pobierania porady: ${error.message}</p>
                            <p>Sprawdź połączenie z internetem lub spróbuj ponownie później.</p>
                        </div>
                    `;
                    updateApiStatus('Błąd podczas pobierania porady');
                });
        });
    }

    if (searchAdviceBtn && searchResultsContainer) {
        searchAdviceBtn.addEventListener('click', () => {
            const query = searchInput.value.trim();
            if (query) {
                searchAdvice(query)
                    .then(data => displayAdviceSearch(data, searchResultsContainer))
                    .catch(error => {
                        searchResultsContainer.innerHTML = `
                            <div class="advice-card error">
                                <p>Błąd podczas wyszukiwania porady: ${error.message}</p>
                                <p>Sprawdź połączenie z internetem lub spróbuj ponownie później.</p>
                            </div>
                        `;
                        updateApiStatus('Błąd podczas wyszukiwania porady');
                    });
            }
        });
    }
});

async function getRandomAdvice() {
    updateApiStatus('Pobieranie losowej porady...');
    const cacheKey = 'advice-random';
    try {
        const apiUrl = 'https://api.adviceslip.com/advice';
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`Status: ${response.status}`);
        }
        const data = await response.json();
        await cacheData(cacheKey, data);
        updateApiStatus('Porada pobrana z API');

        return data;
    } catch (error) {
        if (!navigator.onLine) {
            const cachedData = await getCachedData(cacheKey);
            if (cachedData) {
                updateApiStatus('Pobrano poradę z cache (tryb offline)');

                return cachedData;
            }
        }
        throw error;
    }
}

async function searchAdvice(query) {
    updateApiStatus('Wyszukiwanie porady...');
    const cacheKey = `advice-search-${query.toLowerCase()}`;
    try {
        const cachedResponse = await getCachedData(cacheKey);
        if (cachedResponse) {
            updateApiStatus('Wyniki wyszukiwania z cache');
            return cachedResponse;
        }
        const apiUrl = `https://api.adviceslip.com/advice/search/${encodeURIComponent(query)}`;
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`Status: ${response.status}`);
        }
        const data = await response.json();
        await cacheData(cacheKey, data);
        updateApiStatus('Wyniki wyszukiwania pobrane z API');

        return data;
    } catch (error) {
        if (!navigator.onLine) {
            const cachedData = await getCachedData(cacheKey);
            if (cachedData) {
                updateApiStatus('Wyniki wyszukiwania z cache (tryb offline)');

                return cachedData;
            }
        }
        throw error;
    }
}

function displayAdvice(data, container) {
    if (data && data.slip) {
        container.innerHTML = `
            <div class="advice-card">
                <h3>Porada #${data.slip.id}</h3>
                <p>\"${data.slip.advice}\"</p>
                <p class="update-time">Ostatnia aktualizacja: ${new Date().toLocaleString()}</p>
            </div>
        `;
    } else {
        container.innerHTML = '<div class="advice-card error"><p>Nie udało się pobrać porady.</p></div>';
    }
}

function displayAdviceSearch(data, container) {
    if (data && data.slips && data.slips.length > 0) {
        let html = '';
        data.slips.forEach((slip, idx) => {
            html += `
                <div class="advice-card">
                    <h3>Porada ${idx + 1}</h3>
                    <p>\"${slip.advice}\"</p>
                </div>
            `;
        });
        container.innerHTML = html;
    } else {
        container.innerHTML = '<div class="advice-card error"><p>Brak wyników wyszukiwania.</p></div>';
    }
}

async function getCachedData(key) {
    try {
        const cache = await caches.open(API_CACHE_NAME);
        const response = await cache.match(key);
        if (response) {
            const data = await response.json();
            const timestamp = data._timestamp;
            const now = new Date().getTime();
            const maxAge = 24 * 60 * 60 * 1000; // 24h
            if (now - timestamp < maxAge) {
                return data;
            }
        }
    } catch (error) {
        console.error('Błąd podczas pobierania danych z cache:', error);
    }
}

async function cacheData(key, data) {
    try {
        data._timestamp = new Date().getTime();
        const cache = await caches.open(API_CACHE_NAME);
        const response = new Response(JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json' }
        });
        await cache.put(key, response);
    } catch (error) {
        console.error('Błąd podczas zapisywania danych w cache:', error);
    }
}

function updateApiStatus(message) {
    const statusElement = document.getElementById('api-status');
    if (statusElement) {
        statusElement.textContent = message;
    }
}
