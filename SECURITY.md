# Security Policy

## Supported Versions

Security fixes target the latest published minor version.

| Version | Supported |
| --- | --- |
| `0.2.x` | Yes |
| `< 0.2.0` | No |

## Reporting a Vulnerability

Please report security issues privately through GitHub Security Advisories when available:

https://github.com/standhigher/shopify-rich-text-editor/security/advisories/new

If advisories are unavailable, open a minimal public issue that says you need a private security contact. Do not include exploit details, credentials, merchant data, tokens, or private store URLs in public issues.

## Security Scope

This project treats server-side validation and HTML sanitization as the publishing safety boundary. Business apps are still responsible for authentication, shop ownership checks, Shopify Admin API scopes, upload authorization, and audit logging.
