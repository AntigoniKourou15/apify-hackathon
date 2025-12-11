import { Actor } from 'apify';
import { PlaywrightCrawler, Dataset } from 'crawlee';

await Actor.init();

const input = await Actor.getInput() || {};

// Default to exporting JSON in development (when not on Apify platform)
const shouldExportJson = input.exportToJson ?? (process.env.APIFY_LOCAL_STORAGE_DIR ? false : true);

// Configure proxy if available
let proxyConfiguration;
if (input.proxyConfiguration?.useApifyProxy !== false) {
    try {
        // Default to using residential proxy groups for better success rate
        const proxyConfig = input.proxyConfiguration || { 
            useApifyProxy: true,
            apifyProxyGroups: ['RESIDENTIAL']
        };
        proxyConfiguration = await Actor.createProxyConfiguration(proxyConfig);
        console.log('✅ Using Apify Proxy');
    } catch (error) {
        console.log('⚠️ Proxy configuration not available, continuing without proxy');
        console.log('Error:', error.message);
    }
} else {
    console.log('⚠️ Proxy disabled in input, requests may be blocked');
}

const crawler = new PlaywrightCrawler({
    maxConcurrency: 1, // Keep at 1 to avoid detection
    
    // Use proxy if configured
    proxyConfiguration,
    
    launchContext: {
        launchOptions: {
            headless: true,
            // Stealth options to avoid detection
            args: [
                '--disable-blink-features=AutomationControlled',
                '--disable-dev-shm-usage',
                '--no-sandbox',
                '--disable-setuid-sandbox',
            ],
        },
        // Use incognito to avoid cookie/session tracking
        useIncognitoPages: true,
    },
    
    // Increase timeouts
    requestHandlerTimeoutSecs: 120,
    navigationTimeoutSecs: 60,
    
    // Pre-navigation hooks for stealth
    preNavigationHooks: [
        async ({ page, request }) => {
            // Set realistic viewport
            await page.setViewportSize({ width: 1920, height: 1080 });
            
            // Set realistic user agent
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            
            // Set realistic headers
            await page.setExtraHTTPHeaders({
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Cache-Control': 'max-age=0',
                'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
            });
            
            // Enhanced stealth scripts
            await page.addInitScript(() => {
                // Remove webdriver flag
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined,
                });
                
                // Override plugins
                Object.defineProperty(navigator, 'plugins', {
                    get: () => [1, 2, 3, 4, 5],
                });
                
                // Override languages
                Object.defineProperty(navigator, 'languages', {
                    get: () => ['en-US', 'en'],
                });
                
                // Override permissions
                const originalQuery = window.navigator.permissions.query;
                window.navigator.permissions.query = (parameters) => (
                    parameters.name === 'notifications' ?
                        Promise.resolve({ state: Notification.permission }) :
                        originalQuery(parameters)
                );
                
                // Override chrome object
                window.chrome = {
                    runtime: {},
                };
                
                // Override permissions API
                Object.defineProperty(navigator, 'permissions', {
                    get: () => ({
                        query: async () => ({ state: 'granted' }),
                    }),
                });
            });
        },
    ],

    async requestHandler({ page, request, enqueueLinks }) {
        console.log(`Processing: ${request.url}`);
        
        try {
            // Navigate with more lenient wait condition
            await page.goto(request.url, { 
                waitUntil: 'domcontentloaded', // Less strict than networkidle
                timeout: 60000 
            });
            
            // Wait longer to let page settle and appear more human-like
            await page.waitForTimeout(5000 + Math.random() * 3000); // Random delay 5-8 seconds
            
            // Check if we got blocked
            const status = await page.evaluate(() => document.body.textContent);
            if (status.includes('403') || status.includes('Forbidden') || status.includes('blocked') || status.includes('Access Denied')) {
                throw new Error('Page appears to be blocked (403)');
            }

            // Wait for table to be present and loaded
            try {
                await page.waitForSelector('table#results_tb tbody', { timeout: 30000 });
                await page.waitForSelector('table#results_tb tbody tr', { timeout: 20000 });
                console.log('Table loaded successfully');
            } catch (error) {
                console.log('Waiting for table content...');
                await page.waitForTimeout(5000);
                
                // Double-check for blocking
                const content = await page.content();
                if (content.includes('403') || content.includes('Forbidden')) {
                    throw new Error('Page blocked after waiting');
                }
            }

        // Extract investor data from table rows
        const investors = await page.$$eval(
            'table#results_tb tbody tr',
            (rows) => {
                return rows.map((row) => {
                    // Skip sponsor/ad rows
                    if (row.classList.contains('sponsorRow') || row.classList.contains('adType')) {
                        return null;
                    }

                    // VC Name - from nameCell with #invOverflow
                    const nameCell = row.querySelector('td.nameCell');
                    const vcNameElement = nameCell?.querySelector('#invOverflow');
                    const vcName = vcNameElement?.textContent?.trim() || '';
                    
                    // Skip if no VC name (likely header or empty row)
                    if (!vcName) {
                        return null;
                    }
                    
                    // Investor Type (PE fund, VC, etc.) - second div in nameCell (after the one with #invOverflow)
                    const divs = nameCell?.querySelectorAll('div') || [];
                    const investorType = divs.length > 1 ? divs[divs.length - 1].textContent?.trim() : '';
                    
                    // Use type as investorName if no person name found
                    const investorName = investorType || '';
                    
                    // Target Countries - from td with data-label="Target countries"
                    const countriesCell = row.querySelector('td[data-label="Target countries"]');
                    const countryBadges = countriesCell?.querySelectorAll('.badge-primary') || [];
                    const targetCountries = Array.from(countryBadges)
                        .map(badge => {
                            const text = badge.textContent?.trim() || '';
                            // Extract country name - badges contain country name after flag
                            // Format: "🇺🇸 USA" or just "USA"
                            // Remove any leading non-word characters and get the country name
                            const countryMatch = text.match(/([A-Z][a-zA-Z\s]+)$/);
                            if (countryMatch) {
                                return countryMatch[1].trim();
                            }
                            // Fallback: remove everything before last space or just take the text
                            const parts = text.split(/\s+/);
                            return parts[parts.length - 1] || text;
                        })
                        .filter(Boolean)
                        .filter(country => !country.startsWith('+') && !country.match(/^\+\d+$/)) // Exclude "+2", "+3" etc.
                        .filter(Boolean);
                    
                    // Check Size - from td with data-label="Check size"
                    const checkSizeCell = row.querySelector('td[data-label="Check size"]');
                    const checkSize = checkSizeCell?.textContent?.trim().replace(/\u00A0/g, ' ') || ''; // Replace &nbsp; with space
                    
                    // Funding Stages - from td with data-label="Funding stages"
                    const stagesCell = row.querySelector('td[data-label="Funding stages"]');
                    const stageBadges = stagesCell?.querySelectorAll('.badge-primary') || [];
                    const fundingStages = Array.from(stageBadges)
                        .map(badge => {
                            const text = badge.textContent?.trim() || '';
                            // Exclude badges that are just "+N" links
                            const link = badge.querySelector('a.VClink');
                            if (link && (text.startsWith('+') || text.match(/^\+\d+$/))) {
                                return null;
                            }
                            return text;
                        })
                        .filter((text) => {
                            if (!text) return false;
                            // Exclude "+1", "+2" etc.
                            return !text.includes('+') && !text.match(/^\+\d+$/);
                        });
                    
                    // Funding Requirements - from td with data-label="Funding requirement"
                    const requirementCell = row.querySelector('td[data-label="Funding requirement"], td.criteriaCell');
                    const fundingRequirements = requirementCell?.textContent?.trim() || '';
                    
                    // Get link to investor profile
                    const linkElement = nameCell?.querySelector('a.VClink');
                    const link = linkElement?.getAttribute('href') || '';
                    const fullLink = link ? (link.startsWith('http') ? link : `https://openvc.app/${link}`) : '';
                    
                    // LinkedIn - check if there's a LinkedIn link (might be on detail page)
                    const linkedinLink = row.querySelector('a[href*="linkedin.com"]');
                    const linkedinUrl = linkedinLink?.href || '';
                    
                    // Focus Areas - might need to visit detail page, but try to extract from description
                    const focusAreas = [];
                    
                    // Geographical - extract from countries or might be on detail page
                    const geographical = [];
                    
                    return {
                        vcName,
                        investorName,
                        linkedinUrl,
                        focusAreas,
                        geographical,
                        targetCountries,
                        fundingRequirements,
                        fundingStages,
                        checkSize,
                        description: fundingRequirements, // Use funding requirement as description
                        url: fullLink,
                    };
                }).filter(inv => inv !== null && inv.vcName); // Filter out null and empty rows
            }
        ).catch((error) => {
            console.error('Error extracting data:', error);
            return [];
        });

        console.log(`Found ${investors.length} investors on this page`);

        // Save each investor to Apify Dataset
        for (const investor of investors) {
            if (investor && (investor.vcName || investor.investorName)) {
                await Dataset.pushData(investor);
                console.log(`Saved investor: ${investor.vcName || investor.investorName}`);
            }
        }

            // Handle pagination
            try {
                const url = new URL(request.url);
                const currentPage = parseInt(url.searchParams.get('page') || '1');
                const nextPage = currentPage + 1;
                const nextPageUrl = `https://openvc.app/search?page=${nextPage}`;
                
                const maxPages = input.maxPages || 1000;
                if (nextPage <= maxPages) {
                    // Add longer random delay before next page to appear more human-like
                    const delay = 8000 + Math.random() * 5000; // 8-13 seconds
                    console.log(`Waiting ${Math.round(delay/1000)}s before next page...`);
                    await page.waitForTimeout(delay);
                    await enqueueLinks({
                        urls: [nextPageUrl],
                        label: 'NEXT_PAGE',
                    });
                    console.log(`Enqueued next page: ${nextPage}`);
                } else {
                    console.log(`Reached max pages limit: ${maxPages}`);
                }
            } catch (error) {
                console.log('Error handling pagination:', error);
            }
        } catch (error) {
            console.error(`Error processing ${request.url}:`, error.message);
            // Take screenshot for debugging
            try {
                await page.screenshot({ path: `error-${Date.now()}.png` });
                console.log('Screenshot saved for debugging');
            } catch (screenshotError) {
                // Ignore screenshot errors
            }
            throw error;
        }
    },

    failedRequestHandler({ request }) {
        console.error(`Request ${request.url} failed after retries`);
    },
});

// Start crawling from search page
const startUrls = input.startUrls || ['https://openvc.app/search'];
console.log(`Starting crawl with URLs: ${startUrls.join(', ')}`);
await crawler.run(startUrls);

// Optionally export to JSON file for local frontend use
if (shouldExportJson) {
    console.log('Exporting dataset to JSON...');
    const dataset = await Dataset.open();
    const data = await dataset.getData();
    
    // Create data directory if it doesn't exist
    const fs = await import('fs/promises');
    try {
        await fs.mkdir('data', { recursive: true });
        await fs.writeFile('data/investors.json', JSON.stringify(data.items, null, 2));
        console.log(`Exported ${data.items.length} investors to data/investors.json`);
    } catch (error) {
        console.error('Error exporting to JSON:', error);
    }
}

console.log('Scraping completed!');
await Actor.exit();

