# MongoDB over IndexedDB for canvas persistence

The original design used IndexedDB (browser-native storage) so the app could run with no server. The user explicitly chose MongoDB on their local machine instead, accepting the operational overhead of running a server and a `mongod` daemon. The motivation is a preference for a queryable, inspectable database over an opaque browser store — MongoDB data can be viewed, backed up, and manipulated with standard tooling without opening a browser.

## Considered Options

- **IndexedDB** — zero setup, no server, works offline by default, good blob support. Rejected because data is trapped in the browser and not inspectable with external tools.
- **SQLite** — also local and inspectable, but requires a Python driver and has weaker JSON document support for the nested elements array.
- **MongoDB** — chosen. Runs locally via `mongod`, data is fully inspectable with `mongosh` or Compass, and the document model fits the canvas/elements structure naturally.
