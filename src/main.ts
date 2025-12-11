import { Actor } from 'apify';
import { PlaywrightCrawler, Dataset } from 'crawlee';
import type { InvestorData } from './types.js';

await Actor.init();

const input = await Actor.getInput<{ 
    startUrls?: string[];
    maxPages?: number;
    exportToJson?: boolean;
}>() || {};

// Default to exporting JSON in development (when not on Apify platform)
const shouldExportJson = input.exportToJson ?? (process.env.APIFY_LOCAL_STORAGE_DIR ? false : true);

const crawler = new PlaywrightCrawler({
    maxConcurrency: 2,
    
    launchContext: {
        launchOptions: {
            headless: true,
        },
    },

    async requestHandler({ page, request, enqueueLinks }) {
        console.log(`Processing: ${request.url}`);
        
        // Navigate to the page
        await page.goto(request.url, { 
            waitUntil: 'networkidle',
            timeout: 30000 
        });

        // Wait for table to be present and loaded
        // The page uses dynamic loading, so we need to wait for the actual content
        try {
            await page.waitForSelector('table#results_tb tbody', { timeout: 15000 });
            // Wait a bit more for rows to populate
            await page.waitForSelector('table#results_tb tbody tr', { timeout: 10000 });
            console.log('Table loaded successfully');
        } catch (error) {
            console.log('Waiting for table content...');
            // Try waiting a bit longer for dynamic content
            await page.waitForTimeout(3000);
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
                        .filter(Boolean) as string[];
                    
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
                        .filter((text): text is string => {
                            if (!text) return false;
                            // Exclude "+1", "+2" etc.
                            return !text.includes('+') && !text.match(/^\+\d+$/);
                        }) as string[];
                    
                    // Funding Requirements - from td with data-label="Funding requirement"
                    const requirementCell = row.querySelector('td[data-label="Funding requirement"], td.criteriaCell');
                    const fundingRequirements = requirementCell?.textContent?.trim() || '';
                    
                    // Get link to investor profile
                    const linkElement = nameCell?.querySelector('a.VClink') as HTMLAnchorElement;
                    const link = linkElement?.getAttribute('href') || '';
                    const fullLink = link ? (link.startsWith('http') ? link : `https://openvc.app/${link}`) : '';
                    
                    // LinkedIn - check if there's a LinkedIn link (might be on detail page)
                    const linkedinLink = row.querySelector('a[href*="linkedin.com"]') as HTMLAnchorElement;
                    const linkedinUrl = linkedinLink?.href || '';
                    
                    // Focus Areas - might need to visit detail page, but try to extract from description
                    const focusAreas: string[] = [];
                    
                    // Geographical - extract from countries or might be on detail page
                    const geographical: string[] = [];
                    
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
                await Dataset.pushData(investor as InvestorData);
                console.log(`Saved investor: ${investor.vcName || investor.investorName}`);
            }
        }

        // Handle pagination - extract current page number and increment
        try {
            const url = new URL(request.url);
            const currentPage = parseInt(url.searchParams.get('page') || '1');
            const nextPage = currentPage + 1;
            const nextPageUrl = `https://openvc.app/search?page=${nextPage}`;
            
            // Check if we should continue (optional: limit pages)
            const maxPages = input.maxPages || 1000; // Default to 1000 pages max
            if (nextPage <= maxPages) {
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
    },

    failedRequestHandler({ request }) {
        console.error(`Request ${request.url} failed`);
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
