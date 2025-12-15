
'use server';

import * as cheerio from 'cheerio';

export async function scrapeUrl(url: string): Promise<{ html: string | null; error: string | null; }> {
    if (!url) {
        return { html: null, error: 'URL is required.' };
    }

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache',
            },
            redirect: 'follow',
        });

        if (!response.ok) {
            return { html: null, error: `Failed to fetch URL. Status: ${response.status} ${response.statusText}` };
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('text/html')) {
            return { html: null, error: 'The URL did not return HTML content.' };
        }

        const text = await response.text();
        const $ = cheerio.load(text);

        // Remove script, style, noscript, and svg tags to clean up the content
        $('script, style, noscript, svg').remove();
        
        const bodyContent = $('body').html();
        
        if (!bodyContent) {
            return { html: null, error: 'Could not extract content from the page body.'};
        }

        return { html: `<html><body>${bodyContent}</body></html>`, error: null };

    } catch (error: any) {
        console.error('Scraping error:', error);
        // Ensure a structured error object is always returned
        return { html: null, error: error.message || 'An unknown error occurred during scraping.' };
    }
}
