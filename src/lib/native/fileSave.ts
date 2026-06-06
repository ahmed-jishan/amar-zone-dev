'use client';

import { Capacitor, registerPlugin } from '@capacitor/core';

type NativeFileSavePlugin = {
  saveText(options: { filename: string; mimeType: string; text: string }): Promise<{ uri?: string; filename: string }>;
  saveBase64(options: { filename: string; mimeType: string; base64: string }): Promise<{ uri?: string; filename: string }>;
};

const NativeFileSave = registerPlugin<NativeFileSavePlugin>('NativeFileSave');

function isAndroidNative() {
  return typeof window !== 'undefined' && Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

function safeFilename(filename: string) {
  return filename.replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').trim() || 'selfsync-export';
}

function browserDownload(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = safeFilename(filename);
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  window.setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 1000);
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? '');
      resolve(result.includes(',') ? result.split(',')[1] : result);
    };
    reader.onerror = () => reject(new Error('Could not prepare file for saving.'));
    reader.readAsDataURL(blob);
  });
}

export async function saveTextFile(filename: string, text: string, mimeType = 'text/plain;charset=utf-8') {
  const finalName = safeFilename(filename);
  if (isAndroidNative()) {
    return NativeFileSave.saveText({ filename: finalName, mimeType, text });
  }
  browserDownload(finalName, new Blob([text], { type: mimeType }));
  return { filename: finalName };
}

export async function saveBlobFile(filename: string, blob: Blob, mimeType = blob.type || 'application/octet-stream') {
  const finalName = safeFilename(filename);
  if (isAndroidNative()) {
    const base64 = await blobToBase64(blob);
    return NativeFileSave.saveBase64({ filename: finalName, mimeType, base64 });
  }
  browserDownload(finalName, blob);
  return { filename: finalName };
}
