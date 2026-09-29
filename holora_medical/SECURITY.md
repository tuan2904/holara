# Security policy

Holora Medical is an educational project under active review. Run it on localhost
with synthetic data. It has not passed a production security or clinical assessment.

## Reporting

Use GitHub private vulnerability reporting in the Security tab when enabled, or
contact the repository owner privately. Include affected version, reproduction
steps and impact, without real patient data or working credentials.

## Maintainer actions for the public repository

- Historical commits included environment files and operational SQL data. Treat
  historical credentials as exposed: revoke/rotate them at their providers, change
  database/JWT/SMTP credentials, invalidate sessions and reset affected passwords.
- Removing data from the latest commit does not remove it from Git history, forks
  or clones. Plan a coordinated history cleanup after rotation; do not force-push
  without coordinating with contributors.
- Remove obsolete VPS/SSH deployment credentials from GitHub Actions and the old host.
- Enable secret scanning, push protection and private vulnerability reporting where
  available. Protect main and require reviewed PRs and CI checks.

## Current limitations

Object-level authorization across all medical/payment workflows needs further
review. Static upload/result URLs are not a private medical file-delivery system.
Token storage, file validation/limits, external integrations and dependency
advisories also require ongoing review. CORS does not replace authorization.

Docker publishes ports only to localhost. Do not change the bindings to public
interfaces or use real health records until these controls have been independently
verified. The image risk/confidence/diagnostic text currently includes mock output.
