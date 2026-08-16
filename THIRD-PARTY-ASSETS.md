# Third-party assets

Assets bundled into the plugin that are not covered by this project's ISC
licence. Package dependencies are inventoried separately, in
`THIRD-PARTY-NOTICES.md`, which is generated from the dependency tree; this file
is maintained by hand because vendored artwork cannot be discovered from
`node_modules`.

## Icons: Icons8

The action and category icons under
`com.ntanis.essentials-for-spotify.sdPlugin/images/` are licensed from **Icons8**
and remain subject to the terms below. They are **not** redistributable under
this project's ISC licence.

- Source: <https://icons8.com>
- Licence: Universal Multimedia License Agreement for **Icons8**,
  <https://icons8.com/license>

## Spotify logo

`src/ui/overlay/spotify-logo.svg` is **Spotify**'s official icon, obtained from
**Spotify**'s design resources and used unmodified. The file's own `#1ed760` is
untouched, and the overlay sizes it with `object-fit: contain` so its
proportions are preserved.

It appears in the now-playing overlay to attribute the **Spotify** content shown
there, as **Spotify**'s brand guidelines require. It is not licensed to us or to
anyone under this project's licence: the **Spotify** logo and name are trademarks of
**Spotify AB**, used here under those guidelines only.

- Source: <https://developer.spotify.com/documentation/design>

## Copy and check glyphs: Feather

The `iconCopy` and `iconCheck` glyphs inlined in `src/ui/pi/setup-button.html`
are **Feather**'s `copy` and `check` icons, reproduced verbatim including their
stroke attributes.

- Source: <https://feathericons.com>, <https://github.com/feathericons/feather>
- Licence: MIT, Copyright (c) 2013-2023 Cole Bemis

## Music note glyph: Google Material Icons

The music note inlined in `src/ui/overlay/index.html` is Material Icons'
`music_note`. The artwork is identical; the path is written with absolute rather
than relative curve commands, so this copy has been through a re-exporter rather
than taken from **Google**'s repository directly. If it was obtained from Icons8,
their terms above apply to it as well.

- Source: <https://fonts.google.com/icons>,
  <https://github.com/google/material-design-icons>
- Licence: Apache License 2.0

## Property inspector components: sdpi-components

`src/ui/pi/sdpi-components.js` is a vendored build of Elgato's property
inspector component library. Its licence header is retained verbatim at the top
of the file and travels with it:

- sdpi-components v4.0.1, Copyright Corsair Memory Inc. and other contributors,
  <https://sdpi-components.dev>
- Bundles Lit, Copyright 2019 Google LLC, BSD-3-Clause, <https://lit.dev>

## Trademarks

Not assets, but bundled references worth stating alongside them:

- **Spotify** is a trademark of **Spotify AB**.
- **Stream Deck** is a trademark of **Elgato Systems GmbH**.

This project is not affiliated with, endorsed, sponsored, or approved by either
company. \
**Spotify** metadata shown by the plugin belongs to **Spotify AB** and the
respective rights holders.
