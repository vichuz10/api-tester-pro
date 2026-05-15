const express = require('express');
const cors = require('cors');
const { chromium } = require('playwright');
const url = require('url');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/scan', async (req, res) => {
    let targetUrl = req.body.url;
    const auth = req.body.auth;

    if (!targetUrl) {
        return res.status(400).json({ error: 'URL is required' });
    }
    
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = 'https://' + targetUrl;
    }

    try {
        const parsedTargetUrl = new URL(targetUrl);
        const domain = parsedTargetUrl.hostname;
        
        const results = {
            scannedPages: 0,
            errors: [],
            totalApiRequests: 0,
            urlsScanned: []
        };
        
        const visitedUrls = new Set();
        const urlsToVisit = [targetUrl];
        const maxPages = 8; // Increased limit slightly for better coverage

        const browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 API-Tester/1.0',
            ignoreHTTPSErrors: true
        });
        const page = await context.newPage();

        // 1. Perform Authentication if provided
        if (auth && auth.enabled) {
            console.log(`Performing login at ${auth.loginUrl}...`);
            try {
                let loginUrl = auth.loginUrl;
                if (!loginUrl.startsWith('http')) loginUrl = 'https://' + loginUrl;
                
                await page.goto(loginUrl, { waitUntil: 'networkidle', timeout: 30000 });
                
                const userSel = auth.usernameSelector || 'input[type="email"], input[name="email"], input[name="username"]';
                const passSel = auth.passwordSelector || 'input[type="password"], input[name="password"]';
                const submitSel = auth.submitSelector || 'button[type="submit"], input[type="submit"]';
                
                await page.fill(userSel, auth.username);
                await page.fill(passSel, auth.password);
                
                // Click and wait for navigation
                await Promise.all([
                    page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(() => {}), // Ignore if no full navigation happens (e.g. SPA)
                    page.click(submitSel)
                ]);
                
                // Wait an extra second for SPA dashboards to load
                await page.waitForTimeout(2000);
                console.log('Login attempt completed.');
            } catch (err) {
                console.error(`Login failed: ${err.message}`);
                // Proceed anyway, maybe it partially worked or user provided bad selectors
            }
        }

        // 2. Setup Response Interception
        page.on('response', async response => {
            const status = response.status();
            const requestUrl = response.url();
            const request = response.request();
            const method = request.method();
            const resourceType = request.resourceType();
            
            if (resourceType === 'fetch' || resourceType === 'xhr') {
                results.totalApiRequests++;
                
                if (status >= 400) {
                    let responseBody = '';
                    try {
                        // Attempt to capture the error response body so developers know exactly why it failed
                        const text = await response.text();
                        responseBody = text.substring(0, 1000); // truncate to 1000 chars
                    } catch (e) {
                        responseBody = 'Could not read response body.';
                    }

                    results.errors.push({
                        pageUrl: page.url(),
                        apiUrl: requestUrl,
                        status: status,
                        method: method,
                        statusText: response.statusText() || 'Error',
                        requestPayload: request.postData() || '',
                        responseBody: responseBody
                    });
                }
            }
        });

        // 3. Start Crawling
        while (urlsToVisit.length > 0 && visitedUrls.size < maxPages) {
            const currentUrl = urlsToVisit.shift();
            const cleanUrl = currentUrl.split('#')[0];
            
            if (visitedUrls.has(cleanUrl)) continue;
            
            visitedUrls.add(cleanUrl);
            results.urlsScanned.push(cleanUrl);
            console.log(`Crawling: ${cleanUrl}`);
            
            try {
                await page.goto(cleanUrl, { waitUntil: 'networkidle', timeout: 15000 });
                results.scannedPages++;

                await page.waitForTimeout(1000);

                const hrefs = await page.$$eval('a', links => links.map(a => a.href));
                for (const href of hrefs) {
                    try {
                        const parsedHref = new URL(href);
                        const cleanHref = href.split('#')[0];
                        if (parsedHref.hostname === domain && !visitedUrls.has(cleanHref)) {
                            if (!urlsToVisit.includes(cleanHref)) {
                                urlsToVisit.push(cleanHref);
                            }
                        }
                    } catch (e) {
                    }
                }
            } catch (err) {
                console.error(`Failed to navigate to ${cleanUrl}: ${err.message}`);
            }
        }

        await browser.close();
        res.json(results);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/manual-test', async (req, res) => {
    const { url: targetUrl, method = 'GET', headers = [], body, assertions = [] } = req.body;

    if (!targetUrl) {
        return res.status(400).json({ error: 'URL is required' });
    }

    let formattedUrl = targetUrl;
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = 'https://' + formattedUrl;
    }

    const fetchOptions = {
        method,
        headers: {},
    };

    if (headers && Array.isArray(headers)) {
        headers.forEach(h => {
            if (h.key && h.value) fetchOptions.headers[h.key] = h.value;
        });
    }

    if (body && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
        fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
        if (!fetchOptions.headers['Content-Type']) {
            fetchOptions.headers['Content-Type'] = 'application/json';
        }
    }

    const startTime = Date.now();
    try {
        const response = await fetch(formattedUrl, fetchOptions);
        const responseTime = Date.now() - startTime;
        
        const status = response.status;
        const statusText = response.statusText;
        const responseHeaders = {};
        response.headers.forEach((value, key) => {
            responseHeaders[key] = value;
        });

        let responseBody = '';
        let isJson = false;
        try {
            const text = await response.text();
            responseBody = text;
            try {
                responseBody = JSON.parse(text);
                isJson = true;
            } catch (e) {
                // Keep as text
            }
        } catch (e) {
            responseBody = 'Could not parse response body';
        }

        // Assertion Evaluation and Error Analysis
        const assertionResults = [];
        let overallPass = true;
        let resolutionSuggestion = null;

        assertions.forEach(assertion => {
            let pass = false;
            let actualValue = null;
            let errorMsg = null;
            
            switch (assertion.type) {
                case 'status':
                    actualValue = status;
                    pass = status === parseInt(assertion.expected);
                    if (!pass) errorMsg = `Expected status ${assertion.expected} but got ${status}`;
                    break;
                case 'responseTime':
                    actualValue = responseTime;
                    pass = responseTime <= parseInt(assertion.expected);
                    if (!pass) errorMsg = `Expected response time <= ${assertion.expected}ms but took ${responseTime}ms`;
                    break;
                case 'bodyContains':
                    actualValue = typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody);
                    pass = actualValue.includes(assertion.expected);
                    if (!pass) errorMsg = `Body does not contain "${assertion.expected}"`;
                    break;
            }

            assertionResults.push({
                ...assertion,
                pass,
                actualValue,
                errorMsg
            });

            if (!pass) {
                overallPass = false;
            }
        });

        // Intelligent Error Analysis
        if (!overallPass || status >= 400) {
            if (status === 401 || status === 403) {
                resolutionSuggestion = "Error: Unauthorized or Forbidden. Suggestion: Check if the Authorization header (e.g., Bearer token) is missing, expired, or invalid for this endpoint.";
            } else if (status === 404) {
                resolutionSuggestion = "Error: Not Found. Suggestion: Double-check the URL path. The endpoint might have been renamed or removed.";
            } else if (status >= 500) {
                resolutionSuggestion = "Error: Internal Server Error. Suggestion: The backend crashed while processing this request. Check the server logs for stack traces related to this endpoint.";
            } else if (status === 400) {
                resolutionSuggestion = "Error: Bad Request. Suggestion: The server rejected the payload or query parameters. Verify that the request body matches the expected JSON schema.";
            } else {
                 const failedPerf = assertionResults.find(a => !a.pass && a.type === 'responseTime');
                 if (failedPerf) {
                     resolutionSuggestion = "Error: Performance degradation. Suggestion: The API took too long to respond. Consider optimizing database queries, adding indexing, or implementing caching mechanisms.";
                 } else {
                     resolutionSuggestion = "Error: Assertion Failed. Suggestion: Review the failed assertions and the response payload to identify the mismatch.";
                 }
            }
        }

        res.json({
            success: true,
            request: {
                url: formattedUrl,
                method,
                headers: fetchOptions.headers,
                body: fetchOptions.body
            },
            response: {
                status,
                statusText,
                headers: responseHeaders,
                body: responseBody,
                time: responseTime
            },
            assertions: assertionResults,
            overallPass,
            resolutionSuggestion
        });

    } catch (error) {
        const responseTime = Date.now() - startTime;
        let suggestion = "Error: Network Failure. Suggestion: The server might be down, the URL might be invalid, or the request timed out. Verify the server is running and accessible.";
        
        if (error.message.includes('fetch')) {
             suggestion = "Error: Fetch Failed. Suggestion: This usually indicates an invalid URL format or a completely unreachable host.";
        }

        res.json({
            success: false,
            error: error.message,
            request: {
                url: formattedUrl,
                method,
                headers: fetchOptions.headers,
                body: fetchOptions.body
            },
            response: {
                time: responseTime
            },
            overallPass: false,
            resolutionSuggestion: suggestion
        });
    }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
