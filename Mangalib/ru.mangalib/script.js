const source = {
    id: "ru.mangalib",
    name: "MangaLib",
    version: 10,
    url: "https://mangalib.me",
    languages: ["ru"]
};

async function apiRequest(endpoint, params = {}) {
    const url = new URL(`https://mangalib.me/api/${endpoint}`);
    Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
            url.searchParams.append(key, params[key]);
        }
    });

    const response = await fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://mangalib.me/",
            "Origin": "https://mangalib.me",
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "ru-RU,ru;q=0.9,en;q=0.8"
        }
    });
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
}

function mapManga(item) {
    return {
        id: String(item.id),
        title: item.name,
        cover: item.cover?.default || item.cover?.url || "",
        url: `/manga/${item.slug}`,
        author: item.authors?.map(a => a.name).join(", ") || "",
        artist: item.artists?.map(a => a.name).join(", ") || "",
        description: item.description || "",
        status: mapStatus(item.status),
        genres: item.genres?.map(g => g.name) || []
    };
}

function mapStatus(status) {
    switch(status) {
        case 1: return 1; // Онгоинг
        case 2: return 2; // Завершён
        case 3: return 0; // Анонс
        case 4: return 0; // Приостановлен
        case 5: return 3; // Выпуск прекращён
        default: return 0;
    }
}

async function getPopular(page = 1) {
    const data = await apiRequest("manga", { sort: "views", page });
    return data.map(mapManga);
}

async function getCurrentlyReading(page = 1) {
    const data = await apiRequest("manga", { sort: "reads", page });
    return data.map(mapManga);
}

async function getLatest(page = 1) {
    const data = await apiRequest("manga/updates", { page });
    return data.map(mapManga);
}

async function search(params, page = 1, filters = {}) {
    const queryParams = {
        page: page,
        q: params.query || "",
        sort: filters.sort?.index || 0,
        dir: filters.sort?.ascending ? "asc" : "desc",
        genres: filters.genres?.join(",") || "",
        tags: filters.tags?.join(",") || "",
        type: filters.type?.join(",") || "",
        status: filters.title_status?.join(",") || "",
        year: filters.year,
        rating: filters.rating,
        chap_count: filters.chap_count
    };
    
    const data = await apiRequest("manga/search", queryParams);
    return data.map(mapManga);
}

async function getMangaDetails(url) {
    const match = url.match(/\/manga\/(.+)/);
    if (!match) throw new Error("Invalid manga URL");
    const slug = match[1];
    
    const data = await apiRequest(`manga/${slug}`);
    return mapManga(data);
}

async function getChapterList(url) {
    const match = url.match(/\/manga\/(.+)/);
    if (!match) throw new Error("Invalid manga URL");
    const slug = match[1];
    
    const data = await apiRequest(`manga/${slug}/chapters`);
    
    return data.map(ch => ({
        id: String(ch.id),
        title: `${ch.number}${ch.name ? ": " + ch.name : ""}`,
        volume: ch.volume,
        chapter: ch.number,
        lang: "ru",
        group: ch.translators?.join(", ") || "",
        date: new Date(ch.created_at).getTime()
    }));
}

async function getPageList(url) {
    const match = url.match(/\/chapter\/(.+)/);
    if (!match) throw new Error("Invalid chapter URL");
    const chapterId = match[1];
    
    const data = await apiRequest(`chapter/${chapterId}`);
    
    return data.pages.map(page => ({
        url: page.url
    }));
}

async function getImage(url) {
    const response = await fetch(url, {
        headers: {
            "Referer": "https://mangalib.me/",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
    });
    return await response.blob();
}