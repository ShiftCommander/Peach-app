const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const zlib = require('node:zlib');

const ROOT = path.resolve(__dirname, '..');
const ICONS = path.join(ROOT, 'icons');
const BACKGROUND = [0xd7, 0xd9, 0xdf, 0xff];

const EXPECTED = {
  'favicon-32.png': { size: 32, sha256: 'aad74960741830ed7b4b5e5553e174e84492c6909312e2536dede74b0b8a00ff', transparent: true },
  'apple-touch-icon.png': { size: 180, sha256: '3d9f9a9e320b4dd55553d1e713597f8f5995fcf0964bcd49e220923940e95901', apple: true },
  'icon-192.png': { size: 192, sha256: '5aaabd7d71a801d9b510bea58afa4cb1e3f6cdd359019e1d3833ccb97ea340b5', transparent: true },
  'icon-512.png': { size: 512, sha256: 'f6ed83fe92d9d96fbabf6c41b29d630437c09d8571f8c396200a611d5115228d', transparent: true },
  'maskable-icon-192.png': { size: 192, sha256: '1ebaf454fbb81ba278b9e530d53ba5e037a1e750b4f53f71d3178f44dc91d6db', maskable: true },
  'maskable-icon-512.png': { size: 512, sha256: '590b175ceb057d079a52eedc11ce156f9bd86e55a788e3bbe8199b905dac1918', maskable: true },
};

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function decodeRgbaPng(buffer) {
  assert.equal(buffer.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', 'Invalid PNG signature');

  let offset = 8;
  let width;
  let height;
  let bitDepth;
  let colorType;
  const idat = [];

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    offset += 12 + length;

    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      assert.equal(data[10], 0, 'Unsupported PNG compression');
      assert.equal(data[11], 0, 'Unsupported PNG filtering');
      assert.equal(data[12], 0, 'Interlaced PNGs are not supported by this test');
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
  }

  assert.equal(bitDepth, 8, 'Icons must be 8-bit PNGs');
  assert.equal(colorType, 6, 'Icons must use RGBA PNG color type 6');

  const bytesPerPixel = 4;
  const stride = width * bytesPerPixel;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  assert.equal(raw.length, height * (stride + 1), 'Unexpected decompressed PNG size');

  const pixels = Buffer.alloc(width * height * bytesPerPixel);
  let inputOffset = 0;

  for (let y = 0; y < height; y += 1) {
    const filter = raw[inputOffset];
    inputOffset += 1;
    const rowOffset = y * stride;
    const previousRowOffset = (y - 1) * stride;

    for (let x = 0; x < stride; x += 1) {
      const encoded = raw[inputOffset + x];
      const left = x >= bytesPerPixel ? pixels[rowOffset + x - bytesPerPixel] : 0;
      const up = y > 0 ? pixels[previousRowOffset + x] : 0;
      const upLeft = y > 0 && x >= bytesPerPixel ? pixels[previousRowOffset + x - bytesPerPixel] : 0;

      let value;
      switch (filter) {
        case 0: value = encoded; break;
        case 1: value = encoded + left; break;
        case 2: value = encoded + up; break;
        case 3: value = encoded + Math.floor((left + up) / 2); break;
        case 4: value = encoded + paeth(left, up, upLeft); break;
        default: throw new Error(`Unsupported PNG filter ${filter}`);
      }
      pixels[rowOffset + x] = value & 0xff;
    }
    inputOffset += stride;
  }

  return { width, height, pixels };
}

function rgbaAt(image, x, y) {
  const offset = ((y * image.width) + x) * 4;
  return [...image.pixels.subarray(offset, offset + 4)];
}

function sameRgba(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}

test('Peach icon files keep their approved dimensions and exact bytes', () => {
  for (const [name, expected] of Object.entries(EXPECTED)) {
    const data = fs.readFileSync(path.join(ICONS, name));
    const hash = crypto.createHash('sha256').update(data).digest('hex');
    assert.equal(hash, expected.sha256, `${name} differs from the approved export`);

    const image = decodeRgbaPng(data);
    assert.equal(image.width, expected.size, `${name} width`);
    assert.equal(image.height, expected.size, `${name} height`);
  }
});

test('favicon and standard PWA icons keep transparent corners', () => {
  for (const [name, expected] of Object.entries(EXPECTED)) {
    if (!expected.transparent) continue;
    const image = decodeRgbaPng(fs.readFileSync(path.join(ICONS, name)));
    const corners = [
      rgbaAt(image, 0, 0),
      rgbaAt(image, image.width - 1, 0),
      rgbaAt(image, 0, image.height - 1),
      rgbaAt(image, image.width - 1, image.height - 1),
    ];
    for (const corner of corners) assert.equal(corner[3], 0, `${name} must keep transparent corners`);
  }
});

test('Apple touch icons use opaque platform canvases and the same centered artwork', () => {
  for (const [name, expected] of Object.entries(EXPECTED)) {
    if (!expected.apple) continue;
    const image = decodeRgbaPng(fs.readFileSync(path.join(ICONS, name)));
    for (let index = 3; index < image.pixels.length; index += 4) {
      assert.equal(image.pixels[index], 255, `${name} must be fully opaque`);
    }
    assert.deepEqual(rgbaAt(image, 0, 0), BACKGROUND, `${name} corner background`);
  }
});

test('maskable icons are opaque and keep all artwork inside the W3C safe zone', () => {
  for (const [name, expected] of Object.entries(EXPECTED)) {
    if (!expected.maskable) continue;
    const image = decodeRgbaPng(fs.readFileSync(path.join(ICONS, name)));
    const center = image.width / 2;
    const safeRadius = image.width * 0.4;
    let maxArtworkRadius = 0;
    let artworkPixels = 0;

    for (let y = 0; y < image.height; y += 1) {
      for (let x = 0; x < image.width; x += 1) {
        const pixel = rgbaAt(image, x, y);
        assert.equal(pixel[3], 255, `${name} must be fully opaque`);
        if (sameRgba(pixel, BACKGROUND)) continue;

        artworkPixels += 1;
        const radius = Math.hypot((x + 0.5) - center, (y + 0.5) - center);
        maxArtworkRadius = Math.max(maxArtworkRadius, radius);
        assert.ok(radius <= safeRadius + 0.001, `${name} artwork exceeds the maskable safe zone`);
      }
    }

    assert.ok(artworkPixels > 0, `${name} contains no artwork`);
    assert.ok(maxArtworkRadius / safeRadius >= 0.99, `${name} should fill at least 99% of the guaranteed safe radius`);
    assert.deepEqual(rgbaAt(image, 0, 0), BACKGROUND, `${name} corner background`);
  }
});

test('manifest and HTML expose the correct platform icon roles', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));
  assert.equal(manifest.background_color.toLowerCase(), '#d7d9df');
  assert.equal(manifest.theme_color.toLowerCase(), '#d7d9df');

  const byKey = new Map(manifest.icons.map((icon) => [`${icon.purpose}:${icon.sizes}`, icon.src]));
  assert.equal(byKey.get('any:192x192'), 'icons/icon-192.png');
  assert.equal(byKey.get('any:512x512'), 'icons/icon-512.png');
  assert.equal(byKey.get('maskable:192x192'), 'icons/maskable-icon-192.png');
  assert.equal(byKey.get('maskable:512x512'), 'icons/maskable-icon-512.png');

  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.match(html, /<link rel="apple-touch-icon" href="icons\/apple-touch-icon\.png" \/>/);
  assert.match(html, /<img src="icons\/apple-touch-icon\.png" alt="" \/>/);
});
