# Peach icon assets

All icon exports use the same approved Peach artwork. The source master is `icon-master-1536.png` with SHA-256:

`6e265c0b5f056d7c2eb57bc9d41f1289abd29db3450f27efba3f905ccbf6770e`

The artwork must never be redrawn, regenerated, recolored, blurred or surrounded by an added ring.

## Asset roles

- `favicon-32.png`: transparent 32 px browser favicon.
- `icon-192.png` and `icon-512.png`: transparent standard PWA icons and in-app brand source.
- `apple-touch-icon.png`: 180 px, the same artwork on the opaque `#d7d9df` Apple Home Screen canvas.
- `maskable-icon-192.png` and `maskable-icon-512.png`: opaque Android maskable exports. The approved medallion is enlarged to 106% and deliberately bleeds beyond the canvas so circular launchers clip the outer rim without revealing a surrounding border. A dark wood fallback fills only areas that may remain visible under non-circular masks.

The W3C 40% radius is treated as the guaranteed zone for important content, not as a boundary for the whole artwork. The peach and leaves remain central while decorative wood and metal are allowed to extend outside that zone and be cropped by the launcher mask.

Pixel-level regression tests lock the exact exports, confirm full opacity and verify that a circular launcher perimeter is covered by artwork rather than fallback canvas.
