import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";

function crc32(buf) {
  let crc = ~0;
  for (const byte of buf) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return ~crc >>> 0;
}

function chunk(type, data) {
  const header = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([header, data])));
  return Buffer.concat([length, header, data, crc]);
}

function png(size) {
  const pixels = Buffer.alloc(size * (size * 3 + 1));
  const set = (x, y, r, g, b) => {
    const i = y * (size * 3 + 1) + 1 + x * 3;
    pixels[i] = r;
    pixels[i + 1] = g;
    pixels[i + 2] = b;
  };

  for (let y = 0; y < size; y += 1) {
    pixels[y * (size * 3 + 1)] = 0;
    for (let x = 0; x < size; x += 1) {
      set(x, y, y > size * 0.78 ? 142 : 197, y > size * 0.78 ? 52 : 214, y > size * 0.78 ? 36 : 164);
    }
  }

  const paint = (cx, cy, radius, r, g, b) => {
    const r2 = radius * radius;
    for (let y = Math.max(0, Math.floor(cy - radius)); y < Math.min(size, Math.ceil(cy + radius)); y += 1) {
      for (let x = Math.max(0, Math.floor(cx - radius)); x < Math.min(size, Math.ceil(cx + radius)); x += 1) {
        if ((x - cx) ** 2 + (y - cy) ** 2 <= r2) set(x, y, r, g, b);
      }
    }
  };

  paint(size * 0.5, size * 0.42, size * 0.2, 214, 61, 122);
  paint(size * 0.5, size * 0.42, size * 0.06, 28, 38, 22);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(pixels)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

writeFileSync("public/icon-192.png", png(192));
writeFileSync("public/icon-512.png", png(512));
