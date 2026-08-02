# Peach icon assets

All icon exports use the same approved Peach artwork. The source master is `icon-master-1536.png` with SHA-256:

`6e265c0b5f056d7c2eb57bc9d41f1289abd29db3450f27efba3f905ccbf6770e`

The artwork must never be redrawn, regenerated, recolored, blurred, surrounded by an added ring, or cropped inside its outer metallic circle.

## Asset roles

- `favicon-32.png`: transparent 32 px browser favicon.
- `icon-192.png` and `icon-512.png`: transparent standard PWA icons and in-app brand source.
- `apple-touch-icon.png`: 180 px, the same artwork on the opaque `#d7d9df` Apple Home Screen canvas. Current iPhone uses it directly and iPadOS scales this largest available Web Clip source down as needed.
- `maskable-icon-192.png` and `maskable-icon-512.png`: the same artwork on the opaque `#d7d9df` Android canvas, centered inside the W3C maskable safe zone.

The maskable artwork is 148 px inside the 192 px canvas and 404 px inside the 512 px canvas. Pixel-level regression tests verify that all artwork stays within the guaranteed 40% radius while filling at least 99% of it.
