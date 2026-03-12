# CarCredit - Finance Installment Application

A finance installment calculation and management system built with Node.js, Vercel Serverless Functions, and Supabase.

## Features

- Create contracts with automatic installment calculation
- Generate monthly installment schedules
- Query outstanding installments
- Calculate penalties for overdue payments (0.1% per day)

## Business Rules

### Interest Rate Tiers
| Period | Interest Rate |
|--------|---------------|
| ≤ 12 months | 12% |
| 13-24 months | 14% |
| > 24 months | 16.5% |

### Calculation Formula
```
DP Amount = OTR × (DP% / 100)
Principal = OTR - DP Amount
Total Interest = Principal × Interest Rate
Monthly Installment = (Principal + Total Interest) / Period
```

### Example: Pak Sugus
- OTR: Rp 240,000,000
- DP: 20%
- Period: 18 months (1.5 years)
- Interest: 14% (falls in 13-24 month tier)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

The `.env` file contains Supabase credentials (keep this secure!):

```env
SUPABASE_URL=https://jsiftmzpulskbrgmerup.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
```

### 3. Database Setup

Run the migration script in your Supabase SQL Editor:

```bash
# File: supabase/migrations/001_create_contracts_and_installments.sql
```

Copy the contents and execute in Supabase Dashboard → SQL Editor.

## Testing (Local)

### 🎨 Run Frontend + API (Recommended)

This starts both the API server and frontend UI:

```bash
npm run dev
```

Then open **http://localhost:5173** in your browser.

**Features:**
- Create new contracts with live calculation
- View installment schedules
- Run Query A (Total Due) and Query B (Penalty)
- Beautiful, responsive UI

**Ports:**
- Frontend: http://localhost:5173
- API Server: http://localhost:3001

---

### 🧪 Run API Server Only

For testing with curl or Postman:

```bash
npm run dev:api
```

Then test the endpoints:

```bash
# Create contract
curl -X POST http://localhost:3001/api/generate-contract \
  -H "Content-Type: application/json" \
  -d '{
    "contract_no": "SUGUS-001",
    "client_name": "SUGUS",
    "otr": 240000000,
    "dp_percent": 20,
    "period": 18,
    "start_date": "2024-01-25"
  }'

# Query A: Check installments due
curl "http://localhost:3001/api/report?query=A&client_name=SUGUS&as_of_date=2024-08-14"

# Query B: Calculate penalties
curl "http://localhost:3001/api/report?query=B&as_of_date=2024-08-14"
```

## Deployment

### 1. Commit ke GitHub

```bash
git init
git add .
git commit -m "Initial commit - CarCredit finance app"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Deploy ke Vercel

**Option A: Via Vercel Dashboard (Recommended)**
1. Buka https://vercel.com/new
2. Import GitHub repository kamu
3. Set environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
4. Click Deploy

**Option B: Via CLI**
```bash
npm run deploy
```

Then set environment variables in Vercel Dashboard.

### 3. Test Production

Setelah deploy, test API endpoints:

### POST /api/generate-contract

Create a new contract with installment schedule.

**Request:**
```json
{
  "contract_no": "SUGUS-001",
  "client_name": "SUGUS",
  "otr": 240000000,
  "dp_percent": 20,
  "period": 18,
  "start_date": "2024-01-25"
}
```

**Response:**
```json
{
  "success": true,
  "contract": {
    "id": 1,
    "contract_no": "SUGUS-001",
    "client_name": "SUGUS",
    "otr": 240000000,
    "dp_amount": 48000000,
    "principal": 192000000,
    "interest_rate": 14,
    "period_months": 18
  },
  "calculation": {
    "total_interest": 26880000,
    "total_amount": 218880000,
    "monthly_installment": 12160000
  },
  "installments_count": 18,
  "installments": [...]
}
```

### GET /api/report?query=A

Get total installments due for a client.

**Parameters:**
- `query`: `A`
- `client_name`: (optional, default: `SUGUS`)
- `as_of_date`: (optional, default: `2024-08-14`)

**Example:**
```bash
GET /api/report?query=A&client_name=SUGUS&as_of_date=2024-08-14
```

**Response:**
```json
{
  "query": "A",
  "description": "Total installments due",
  "client_name": "SUGUS",
  "as_of_date": "2024-08-14",
  "total_due": 97280000,
  "installments_count": 8,
  "installments": [...]
}
```

### GET /api/report?query=B

Calculate penalties for unpaid installments from June 2024.

**Parameters:**
- `query`: `B`
- `as_of_date`: (optional, default: `2024-08-14`)
- `contract_no`: (optional, filter by specific contract)

**Example:**
```bash
GET /api/report?query=B&as_of_date=2024-08-14
```

**Response:**
```json
{
  "query": "B",
  "description": "Penalty calculation for unpaid installments (0.1% per day)",
  "period": {
    "from": "2024-06-01",
    "to": "2024-08-14"
  },
  "as_of_date": "2024-08-14",
  "total_penalties": 1234567,
  "penalties_count": 3,
  "penalties": [
    {
      "contract_no": "SUGUS-001",
      "client_name": "SUGUS",
      "installment_no": 6,
      "amount": 12160000,
      "due_date": "2024-06-25",
      "days_late": 50,
      "penalty_rate": 0.1,
      "total_penalty": 608000
    }
  ]
}
```

## Project Structure

```
carcredit/
├── .env                          # Environment variables (secure!)
├── .gitignore                    # Git ignore rules
├── package.json                  # Dependencies
├── vite.config.js                # Vite frontend config
├── index.html                    # Frontend UI
├── vercel.json                   # Vercel configuration
├── README.md                     # Documentation
├── scripts/
│   └── dev.sh                    # Dev server launcher
├── api/
│   ├── generate-contract.js      # Contract creation endpoint
│   └── report.js                 # Report queries endpoint
├── lib/
│   ├── calculator.js             # Business logic & calculations
│   └── supabaseClient.js         # Supabase client setup
├── public/                       # Static assets
└── supabase/
    └── migrations/
        └── 001_create_contracts_and_installments.sql
```

## Testing with Pak Sugus Data

```bash
# Create contract for Pak Sugus
curl -X POST http://localhost:3000/api/generate-contract \
  -H "Content-Type: application/json" \
  -d '{
    "contract_no": "SUGUS-001",
    "client_name": "SUGUS",
    "otr": 240000000,
    "dp_percent": 20,
    "period": 18,
    "start_date": "2024-01-25"
  }'

# Query A: Check installments due as of 2024-08-14
curl "http://localhost:3000/api/report?query=A&client_name=SUGUS&as_of_date=2024-08-14"

# Query B: Calculate penalties
curl "http://localhost:3000/api/report?query=B&as_of_date=2024-08-14"
```

## Security Notes

- ⚠️ **NEVER** commit `.env` files to version control
- ⚠️ **NEVER** expose API keys in frontend code or README
- ✅ Environment variables are loaded from `.env` locally
- ✅ For Vercel deployment, set environment variables in Vercel Dashboard
