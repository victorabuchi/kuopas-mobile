import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import type { PhotoAttachment } from './types';

export async function pickPhoto(): Promise<PhotoAttachment | null> {
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
  if (result.canceled) return null;

  const asset = result.assets[0]!;
  const type = asset.mimeType ?? 'image/jpeg';
  const ext = type.split('/')[1] === 'jpeg' ? 'jpg' : (type.split('/')[1] ?? 'jpg');
  return { uri: asset.uri, name: asset.fileName ?? `photo.${ext}`, type };
}

export async function pickVideo(): Promise<PhotoAttachment | null> {
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'] });
  if (result.canceled) return null;

  const asset = result.assets[0]!;
  const type = asset.mimeType ?? 'video/mp4';
  const ext = type === 'video/quicktime' ? 'mov' : (type.split('/')[1] ?? 'mp4');
  return { uri: asset.uri, name: asset.fileName ?? `video.${ext}`, type };
}

export async function pickDocument(): Promise<PhotoAttachment | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;

  const asset = result.assets[0]!;
  return { uri: asset.uri, name: asset.name, type: asset.mimeType ?? 'application/pdf' };
}
