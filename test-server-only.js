const http = require('http');
const url = require('url');

// Import handlers (dotenv already loaded in supabaseClient.js)
const generateContractHandler = require('./api/generate-contract');
const reportHandler = require('./api/report');

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // Parse query string
    req.query = parsedUrl.query || {};

    // Parse JSON body for POST requests
    if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                req.body = JSON.parse(body);
            } catch (e) {
                req.body = {};
            }
            routeRequest(req, res, pathname);
        });
        return;
    }

    routeRequest(req, res, pathname);
});

async function routeRequest(req, res, pathname) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.writeHead(200).end();
    }

    if (pathname === '/api/generate-contract') {
        await generateContractHandler(req, res);
    } else if (pathname === '/api/report') {
        await reportHandler(req, res);
    } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not found' }));
    }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Test server running at http://localhost:${PORT}`);
    console.log(``);
    console.log(`Available endpoints:`);
    console.log(`  POST /api/generate-contract`);
    console.log(`  GET  /api/report?query=A|B`);
    console.log(``);
    console.log(`Press Ctrl+C to stop`);
});
