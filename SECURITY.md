# Security Configuration

## Development Server Security

### Network Access
- **Default**: Dev server is restricted to `localhost` only
- **Network Access**: Set `VITE_ALLOW_NETWORK_ACCESS=1` in `.env.local` to enable network access
- **Warning**: Only enable network access on trusted networks

### Security Headers
The dev server automatically applies security headers:
- `X-Content-Type-Options: nosniff` - Prevents MIME type sniffing
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-XSS-Protection: 1; mode=block` - XSS protection
- `Referrer-Policy: strict-origin-when-cross-origin` - Controls referrer information
- `Permissions-Policy` - Restricts browser features

### Port Configuration
- **Port**: 3001 (configurable via `PORT` env var)
- **Strict Port**: Server will fail if port is in use (prevents silent failures)

## Build Security

### Source Maps
- **Development**: Source maps enabled for debugging
- **Production**: Source maps disabled to prevent source code exposure

### Code Obfuscation
- Production builds use obfuscated chunk names
- Manual chunk splitting prevents code analysis

## Environment Variables

### Security Best Practices
1. **Never commit `.env.local`** - Contains sensitive keys
2. **Use `.env.example`** - Template for required variables
3. **Prefix sensitive vars** - Use `VITE_SECRET_` prefix (automatically filtered)
4. **Validate on startup** - Check for required variables

### Required Variables
See `.env.example` for required environment variables.

## Audio Context Security

### Browser Permissions
- AudioContext requires user interaction to resume (browser security)
- Microphone access requires explicit user permission
- File system access is sandboxed

## API Security

### CORS Configuration
- **Development**: Same-origin only (localhost)
- **Production**: Configure via deployment platform (Vercel, Netlify, etc.)

### Supabase Functions
- CORS headers configured per function
- API keys stored in environment variables
- Authentication required for sensitive operations

## Reporting Security Issues

If you discover a security vulnerability, please:
1. **Do not** open a public issue
2. Email security concerns to: [your-security-email]
3. Include steps to reproduce
4. Allow time for fix before disclosure

## Security Checklist

Before deploying to production:
- [ ] All `.env.local` files excluded from git
- [ ] Source maps disabled in production build
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] API keys rotated and secure
- [ ] HTTPS enabled
- [ ] Rate limiting configured (if applicable)
- [ ] Input validation on all user inputs
- [ ] Audio file size limits enforced

