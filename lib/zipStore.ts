/**
 * Stored (method 0) ZIP reader/writer.
 * PDFs are already compressed, so store-only keeps CPU low for ~250 files
 * and stays dependency-free for both the server batches and the browser merge.
 */

export interface StoredZipEntry {
  name: string;
  data: Uint8Array;
}

const LOCAL_SIGNATURE = 0x04034b50;
const CENTRAL_SIGNATURE = 0x02014b50;
const EOCD_SIGNATURE = 0x06054b50;
const UTF8_FLAG = 0x0800;

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let bit = 0; bit < 8; bit++) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (~crc) >>> 0;
}

function sanitizeEntryName(name: string): string {
  const cleaned = String(name || '')
    .replace(/\\/g, '/')
    .split('/')
    .filter((part) => part && part !== '.' && part !== '..')
    .join('_')
    .replace(/[\u0000-\u001f]/g, '')
    .trim();
  return cleaned || 'laporan.pdf';
}

function dosDateTime(date: Date): { time: number; date: number } {
  const year = Math.max(1980, date.getUTCFullYear());
  const time =
    (date.getUTCHours() << 11) | (date.getUTCMinutes() << 5) | Math.floor(date.getUTCSeconds() / 2);
  const dosDate = ((year - 1980) << 9) | ((date.getUTCMonth() + 1) << 5) | date.getUTCDate();
  return { time, date: dosDate };
}

function writeU16(view: DataView, offset: number, value: number) {
  view.setUint16(offset, value & 0xffff, true);
}

function writeU32(view: DataView, offset: number, value: number) {
  view.setUint32(offset, value >>> 0, true);
}

function readU16(view: DataView, offset: number) {
  return view.getUint16(offset, true);
}

function readU32(view: DataView, offset: number) {
  return view.getUint32(offset, true);
}

export function buildStoredZip(files: StoredZipEntry[], modifiedAt: Date = new Date()): Uint8Array {
  const encoder = new TextEncoder();
  const stamp = dosDateTime(modifiedAt);
  const prepared = files.map((file) => {
    const nameBytes = encoder.encode(sanitizeEntryName(file.name));
    const data = file.data instanceof Uint8Array ? file.data : new Uint8Array(file.data);
    return { nameBytes, data, crc: crc32(data) };
  });

  let localSize = 0;
  let centralSize = 0;
  for (const file of prepared) {
    localSize += 30 + file.nameBytes.length + file.data.length;
    centralSize += 46 + file.nameBytes.length;
  }

  const output = new Uint8Array(localSize + centralSize + 22);
  const view = new DataView(output.buffer);
  let offset = 0;
  const localOffsets: number[] = [];

  for (const file of prepared) {
    localOffsets.push(offset);
    writeU32(view, offset, LOCAL_SIGNATURE);
    writeU16(view, offset + 4, 20);
    writeU16(view, offset + 6, UTF8_FLAG);
    writeU16(view, offset + 8, 0);
    writeU16(view, offset + 10, stamp.time);
    writeU16(view, offset + 12, stamp.date);
    writeU32(view, offset + 14, file.crc);
    writeU32(view, offset + 18, file.data.length);
    writeU32(view, offset + 22, file.data.length);
    writeU16(view, offset + 26, file.nameBytes.length);
    writeU16(view, offset + 28, 0);
    output.set(file.nameBytes, offset + 30);
    output.set(file.data, offset + 30 + file.nameBytes.length);
    offset += 30 + file.nameBytes.length + file.data.length;
  }

  const centralStart = offset;
  for (let i = 0; i < prepared.length; i++) {
    const file = prepared[i];
    writeU32(view, offset, CENTRAL_SIGNATURE);
    writeU16(view, offset + 4, 20);
    writeU16(view, offset + 6, 20);
    writeU16(view, offset + 8, UTF8_FLAG);
    writeU16(view, offset + 10, 0);
    writeU16(view, offset + 12, stamp.time);
    writeU16(view, offset + 14, stamp.date);
    writeU32(view, offset + 16, file.crc);
    writeU32(view, offset + 20, file.data.length);
    writeU32(view, offset + 24, file.data.length);
    writeU16(view, offset + 28, file.nameBytes.length);
    writeU16(view, offset + 30, 0);
    writeU16(view, offset + 32, 0);
    writeU16(view, offset + 34, 0);
    writeU16(view, offset + 36, 0);
    writeU32(view, offset + 38, 0);
    writeU32(view, offset + 42, localOffsets[i]);
    output.set(file.nameBytes, offset + 46);
    offset += 46 + file.nameBytes.length;
  }

  const centralLength = offset - centralStart;
  writeU32(view, offset, EOCD_SIGNATURE);
  writeU16(view, offset + 4, 0);
  writeU16(view, offset + 6, 0);
  writeU16(view, offset + 8, prepared.length);
  writeU16(view, offset + 10, prepared.length);
  writeU32(view, offset + 12, centralLength);
  writeU32(view, offset + 16, centralStart);
  writeU16(view, offset + 20, 0);

  return output;
}

export function readStoredZip(bytes: Uint8Array): StoredZipEntry[] {
  if (!bytes || bytes.length < 22) {
    throw new Error('Arsip ZIP tidak valid.');
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const decoder = new TextDecoder();
  const entries: StoredZipEntry[] = [];
  let offset = 0;

  while (offset + 4 <= bytes.length) {
    const signature = readU32(view, offset);
    if (signature === CENTRAL_SIGNATURE || signature === EOCD_SIGNATURE) break;
    if (signature !== LOCAL_SIGNATURE) {
      throw new Error('Arsip ZIP tidak valid.');
    }
    if (offset + 30 > bytes.length) throw new Error('Arsip ZIP tidak valid.');

    const flags = readU16(view, offset + 6);
    const method = readU16(view, offset + 8);
    const compressedSize = readU32(view, offset + 18);
    const nameLength = readU16(view, offset + 26);
    const extraLength = readU16(view, offset + 28);
    const nameStart = offset + 30;
    const dataStart = nameStart + nameLength + extraLength;
    const dataEnd = dataStart + compressedSize;

    if (method !== 0) throw new Error('Arsip ZIP memakai kompresi yang tidak didukung.');
    if (flags & 0x0008) throw new Error('Arsip ZIP tidak valid.');
    if (dataEnd > bytes.length) throw new Error('Arsip ZIP tidak valid.');

    const name = decoder.decode(bytes.subarray(nameStart, nameStart + nameLength));
    const data = bytes.subarray(dataStart, dataEnd);
    entries.push({ name, data: new Uint8Array(data) });
    offset = dataEnd;
  }

  return entries;
}
