## [Unreleased]

### Added
- Add a simpler `new Bgrapher()` interface by using an internal, per-Bgrapher state by default.

### Changed
- Standardize capitalization to "Bgraph" instead of "BGraph".
- Remove bgraphState from function signature of `Bgrapher.draw()`.

### Removed
- Get rid of large test non-interactive bgraph.

## [0.1.0] - 2021-06-09

### Added
- Display bgraphs within HTML elements.
- Manage common state across multiple bgraphs.
- Interact with and move around bgraphs.
- Respond to bgraph interactions via custom callbacks.
