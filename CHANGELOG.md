## [Unreleased]

### Added
- Allow controlling bgraph margin via `bgraphState`.
- Add `centerView` and `center` interfaces for centering a bgraph on screen.

### Changed
- Control showing debug info via Bgrapher object's `debug` attribute rather than via node env.
- Change default margin to 100% of client width.
- Set default colors for bgraph background and highlights if none are specified.

### Fixed
- Fix dev example block info element to use "label" rather than "text".
- Fix issue with initial offset where size of screen is smaller than graph + margin but larger than graph.

## [1.0.0] - 2021-06-25

### Added
- Add a simpler `new Bgrapher()` interface by using an internal, per-Bgrapher state by default.

### Changed
- Standardize capitalization to "Bgraph" instead of "BGraph".
- Remove bgraphState from function signature of `Bgrapher.draw()`.
- Use `1`/`2`/`3`/`4` for directions in bgraph format rather than `up`/`right`/`down`/`left`.

### Removed
- Get rid of large test non-interactive bgraph.

## [0.1.0] - 2021-06-09

### Added
- Display bgraphs within HTML elements.
- Manage common state across multiple bgraphs.
- Interact with and move around bgraphs.
- Respond to bgraph interactions via custom callbacks.
