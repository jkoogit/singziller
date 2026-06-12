# Collection Policy Foundation Review

## Summary

Implemented the first testable collection policy foundation without live scraping. The code covers mock provider collection, provider registry, raw payload hashing, duplicate prevention, run logging, source probe decisions, schedule policy, and validation scoring.

## Verification

- `node tests\sheets.test.js`
- `cd server && npm test`
- `cd server && npm run build`

## Remaining Risks

- Live TJ/KY scraping is not implemented.
- KY official search URL still requires a dedicated probe task before production collection.
- PostgreSQL repository integration is not implemented in this slice.
- Actual schedule policy must be recalibrated after two weeks of sample collection metrics.
