# OpenVC Scraper with React Frontend

A complete solution for scraping investors from OpenVC (with authentication) and displaying them in a modern React frontend.

## Features

- **Apify Actor**: Deployable scraper that runs on Apify platform
- **Authentication**: Handles login to OpenVC
- **Data Extraction**: Scrapes VC name, investor name, LinkedIn, focus areas, funding stages, check size, target countries, and more
- **React Frontend**: Beautiful, responsive UI to view and interact with scraped investors
- **Actions**: Send email, visit website, and open LinkedIn profiles

## Project Structure

```
.
├── src/                    # Backend Apify Actor
│   ├── main.ts            # Main scraper entry point
│   ├── auth.ts            # Login functionality
│   └── types.ts           # TypeScript interfaces
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── App.tsx        # Main app component
│   │   ├── main.tsx       # React entry point
│   │   ├── components/
│   │   │   ├── InvestorList.tsx
│   │   │   └── InvestorCard.tsx
│   │   ├── types.ts
│   │   └── App.css
│   ├── package.json
│   └── vite.config.ts
├── data/                  # Scraped data (gitignored)
│   └── investors.json
├── package.json           # Backend dependencies
└── apify.json             # Apify actor configuration
```

## Backend Setup (Apify Actor)

### Prerequisites

- Node.js 18+ installed
- Apify account (for deployment)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers:
```bash
npx playwright install
```

### Configuration

#### Option 1: Environment Variables (Local Development)

Create a `.env` file:
```
OPENVC_EMAIL=your-email@example.com
OPENVC_PASSWORD=your-password
```

#### Option 2: Apify Input (Platform)

When running on Apify platform, provide credentials via input:
```json
{
  "email": "your-email@example.com",
  "password": "your-password",
  "startUrls": ["https://openvc.app/search"],
  "exportToJson": true
}
```

#### Option 3: Apify Secrets (Recommended for Production)

Store credentials in Apify's secret store:
- Go to Apify Console → Settings → Secrets
- Add `OPENVC_EMAIL` and `OPENVC_PASSWORD`
- Access them automatically via `Actor.getEnv()`

### Running Locally

**Development mode (with hot reload and JSON export):**
```bash
npm run dev
```

When running, you can provide input via:
- Environment variables (`.env` file)
- Command line: `npm run dev -- --input input.json`
- Or modify `src/main.ts` to set `exportToJson: true` by default

**Using input file:**
1. Copy `input.example.json` to `input.json`
2. Fill in your credentials
3. Run: `npm run dev -- --input input.json`

**Build and run:**
```bash
npm run build
npm start
```

### Important: Update Selectors

Before running, you **must** inspect the OpenVC website and update the CSS selectors in:
- `src/auth.ts` - Login form selectors
- `src/main.ts` - Investor card and data extraction selectors

The current selectors are placeholders and need to match the actual HTML structure of OpenVC.

### Deploying to Apify Platform

1. Install Apify CLI (if not already installed):
```bash
npm install -g apify-cli
```

2. Login to Apify:
```bash
apify login
```

3. Push your actor:
```bash
apify push
```

4. Run the actor from Apify Console or via API

## Frontend Setup

### Quick Start (With Sample Data)

The frontend includes sample data so you can see it working immediately:

1. Navigate to frontend directory:
```bash
cd frontend
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open `http://localhost:3000` - you should see 5 sample investors!

### Actor Control Feature

The frontend includes an **Actor Control** panel that allows you to:
- View actor details (name, username, total runs)
- Start a new actor run directly from the UI
- Monitor run status in real-time
- Automatically refresh data when a run completes

**To enable Actor Control:**

1. Create `frontend/.env` file:
```env
VITE_APIFY_ACTOR_ID=antigoni/apify-hackathon
VITE_APIFY_API_TOKEN=your-api-token
```

2. Get your Actor ID:
   - After deploying your actor with `apify push`, you'll get an actor ID
   - Format: `username/actor-name` (e.g., `antigoni/apify-hackathon`)

3. Get your API Token:
   - Go to https://console.apify.com/account/integrations
   - Copy your API token

4. Restart the frontend dev server to load the new environment variables

The Actor Control panel will appear at the top of the page, showing actor information and a "Run Actor" button.

### Installation

1. Navigate to frontend directory:
```bash
cd frontend
npm install
```

### Running Development Server

```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

**Note:** Sample data is located at `frontend/public/data/investors.json`. When you run the scraper and export data, it will replace this file.

### Building for Production

```bash
npm run build
```

### Data Source Configuration

The frontend can load data from two sources:

#### Option 1: Local JSON File (Development)

1. Run the scraper with `exportToJson: true` in input
2. Copy `data/investors.json` to `frontend/public/data/investors.json`
3. The frontend will automatically load it

#### Option 2: Apify Dataset API (Production)

1. After running the scraper on Apify platform, get the Dataset ID
2. Create `frontend/.env` file:
```
VITE_APIFY_DATASET_ID=your-dataset-id
VITE_APIFY_API_TOKEN=your-api-token
```
3. The frontend will load data from Apify Dataset API

## Data Fields

The scraper extracts the following data:

- **vcName**: Name of the VC firm
- **investorName**: Name of the investor (person)
- **linkedinUrl**: LinkedIn profile URL
- **focusAreas**: Array of focus industries/areas
- **geographical**: Array of geographical locations
- **targetCountries**: Array of target countries
- **fundingRequirements**: Funding requirements description
- **fundingStages**: Array of funding stages (Seed, Series A, etc.)
- **checkSize**: Check size range
- **url**: OpenVC profile URL
- **description**: Investor description/bio

## Frontend Features

- **Responsive Design**: Works on desktop and mobile
- **Interactive Cards**: Hover effects and smooth transitions
- **Action Buttons**:
  - 📧 Send Email: Opens default email client
  - 🌐 Visit Website: Opens investor's OpenVC profile
  - 💼 LinkedIn: Opens LinkedIn profile (if available)
- **Tag System**: Color-coded tags for focus areas, stages, locations, and countries
- **Loading States**: Shows loading and error states

## Troubleshooting

### Login Issues

- Verify your credentials are correct
- Check if OpenVC requires 2FA (may need manual intervention)
- Inspect the login page and update selectors in `src/auth.ts`
- Check browser console for errors (set `headless: false` temporarily)

### Data Extraction Issues

- Inspect the OpenVC search page HTML structure
- Update selectors in `src/main.ts` to match actual page structure
- Use browser DevTools to find correct CSS selectors
- Test selectors in browser console before updating code

### Frontend Not Loading Data

- Ensure `data/investors.json` exists in `frontend/public/data/` (for local)
- Check Apify Dataset ID and API token (for production)
- Check browser console for errors
- Verify JSON file format is correct

## License

ISC
