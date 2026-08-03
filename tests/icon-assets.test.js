const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const zlib = require('node:zlib');

const ROOT = path.resolve(__dirname, '..');
const ICONS = path.join(ROOT, 'icons');
const APPLE_BACKGROUND = [0xd7, 0xd9, 0xdf, 0xff];
const MASKABLE_FALLBACK = [0x19, 0x0c, 0x08, 0xff];

const EXPECTED = {
  'favicon-32.png': { size: 32, sha256: 'aad74960741830ed7b4b5e5553e174e84492c6909312e2536dede74b0b8a00ff', transparent: true },
  'apple-touch-icon.png': { size: 180, sha256: '3d9f9a9e320b4dd55553d1e713597f8f5995fcf0964bcd49e220923940e95901', apple: true },
  'icon-192.png': { size: 192, sha256: '5aaabd7d71a801d9b510bea58afa4cb1e3f6cdd359019e1d3833ccb97ea340b5', transparent: true },
  'icon-512.png': { size: 512, sha256: 'f6ed83fe92d9d96fbabf6c41b29d630437c09d8571f8c396200a611d5115228d', transparent: true },
  'maskable-icon-192.png': { size: 192, sha256: 'fa5770118d3d7811ddb9e7387acb1d464a66911132894ae8d3b3706c49f2727d', maskable: true },
  'maskable-icon-512.png': { size: 512, sha256: '66b757ebd68e9e137928ae0ee64e07f9a163385306fa3dee78fd541c80b26bf7', maskable: true },
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
  return a.every((value, index) => value === b[index]);
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
    const last = image.width - 1;
    for (const [x, y] of [[0, 0], [last, 0], [0, last], [last, last]]) {
      assert.equal(rgbaAt(image, x, y)[3], 0, `${name} must keep transparent corners`);
    }
  }
});

test('Apple touch icon stays opaque on its platform canvas', () => {
  const image = decodeRgbaPng(fs.readFileSync(path.join(ICONS, 'apple-touch-icon.png')));
  for (let index = 3; index < image.pixels.length; index += 4) {
    assert.equal(image.pixels[index], 255, 'apple-touch-icon.png must be fully opaque');
  }
  assert.deepEqual(rgbaAt(image, 0, 0), APPLE_BACKGROUND);
});

test('Android maskable icons are opaque and full bleed under a circular launcher mask', () => {
  for (const [name, expected] of Object.entries(EXPECTED)) {
    if (!expected.maskable) continue;
    const image = decodeRgbaPng(fs.readFileSync(path.join(ICONS, name)));

    for (let index = 3; index < image.pixels.length; index += 4) {
      assert.equal(image.pixels[index], 255, `${name} must be fully opaque`);
    }

    const center = image.width / 2;
    const radius = image.width * 0.495;
    for (let degrees = 0; degrees < 360; degrees += 22.5) {
      const radians = degrees * Math.PI / 180;
      const x = Math.min(image.width - 1, Math.max(0, Math.round(center + Math.cos(radians) * radius - 0.5)));
      const y = Math.min(image.height - 1, Math.max(0, Math.round(center + Math.sin(radians) * radius - 0.5)));
      assert.equal(
        sameRgba(rgbaAt(image, x, y), MASKABLE_FALLBACK),
        false,
        `${name} exposes fallback canvas at ${degrees} degrees`,
      );
    }
  }
});

test('manifest and HTML expose the correct platform icon roles', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));
  const byKey = new Map(manifest.icons.map((icon) => [`${icon.purpose}:${icon.sizes}`, icon.src]));

  assert.equal(byKey.get('any:192x192'), 'icons/icon-192.png');
  assert.equal(byKey.get('any:512x512'), 'icons/icon-512.png');
  assert.equal(byKey.get('maskable:192x192'), 'icons/maskable-icon-192.png');
  assert.equal(byKey.get('maskable:512x512'), 'icons/maskable-icon-512.png');

  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.match(html, /<link rel="icon" type="image\/png" sizes="32x32" href="icons\/favicon-32\.png" \/>/);
  assert.match(html, /<link rel="apple-touch-icon" href="icons\/apple-touch-icon\.png" \/>/);
});
