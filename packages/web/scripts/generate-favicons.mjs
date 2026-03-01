import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");
const svgPath = join(publicDir, "logo.svg");
const svgBuffer = readFileSync(svgPath);

const sharp = (await import("sharp")).default;

const sizes = [
  { name: "favicon-16x16.png", size: 16 },
  { name: "favicon-32x32.png", size: 32 },
  { name: "apple-touch-icon.png", size: 180 },
  { name: "android-chrome-192x192.png", size: 192 },
  { name: "android-chrome-512x512.png", size: 512 },
];

for (const { name, size } of sizes) {
  await sharp(svgBuffer, { density: Math.max(72, size * 4) })
    .resize(size, size, { kernel: "nearest" })
    .png()
    .toFile(join(publicDir, name));
  console.log(`Generated ${name} (${size}x${size})`);
}

// Generate favicon.ico from 16x16 and 32x32 PNGs
const ico16 = await sharp(svgBuffer, { density: 288 })
  .resize(16, 16, { kernel: "nearest" })
  .png()
  .toBuffer();
const ico32 = await sharp(svgBuffer, { density: 576 })
  .resize(32, 32, { kernel: "nearest" })
  .png()
  .toBuffer();

function createIco(images) {
  const numImages = images.length;
  const headerSize = 6;
  const entrySize = 16;
  const dataOffset = headerSize + entrySize * numImages;

  let totalSize = dataOffset;
  for (const img of images) totalSize += img.data.length;

  const buffer = Buffer.alloc(totalSize);
  buffer.writeUInt16LE(0, 0);
  buffer.writeUInt16LE(1, 2);
  buffer.writeUInt16LE(numImages, 4);

  let offset = dataOffset;
  for (let i = 0; i < numImages; i++) {
    const img = images[i];
    const entryOffset = headerSize + i * entrySize;
    buffer.writeUInt8(img.width >= 256 ? 0 : img.width, entryOffset);
    buffer.writeUInt8(img.height >= 256 ? 0 : img.height, entryOffset + 1);
    buffer.writeUInt8(0, entryOffset + 2);
    buffer.writeUInt8(0, entryOffset + 3);
    buffer.writeUInt16LE(1, entryOffset + 4);
    buffer.writeUInt16LE(32, entryOffset + 6);
    buffer.writeUInt32LE(img.data.length, entryOffset + 8);
    buffer.writeUInt32LE(offset, entryOffset + 12);
    img.data.copy(buffer, offset);
    offset += img.data.length;
  }
  return buffer;
}

const icoBuffer = createIco([
  { width: 16, height: 16, data: ico16 },
  { width: 32, height: 32, data: ico32 },
]);
writeFileSync(join(publicDir, "favicon.ico"), icoBuffer);
console.log("Generated favicon.ico (16x16 + 32x32)");

console.log("Done!");
