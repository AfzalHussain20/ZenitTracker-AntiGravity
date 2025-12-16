'use server'

/**
 * Server Action to fetch raw HTML from a URL.
 * Note: This is a basic fetch and won't execute JavaScript (SPA).
 */
export async function fetchUrlSource(url: string) {
    try {
        if (!url.startsWith('http')) {
            url = 'https://' + url;
        }
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            next: { revalidate: 0 }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
        }

        const text = await response.text();
        return { success: true, data: text };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
