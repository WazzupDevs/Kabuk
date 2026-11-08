import { preparePhotoUpload } from '@shared/jpegMetadata.ts';
import {
  COVER_HEIGHT_PX,
  COVER_MAX_BYTES,
  COVER_WIDTH_PX,
  PHOTO_BUCKET,
  PHOTO_JPEG_QUALITY,
  PHOTO_MAX_BYTES,
  PHOTO_SIZE_PX,
} from '@shared/profile.ts';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { profileApi } from '@/lib/api';
import { supabase } from '@/lib/supabase';

export type PhotoSource = 'library' | 'camera';

export class PhotoError extends Error {
  readonly reason: 'permission' | 'invalid';

  constructor(reason: 'permission' | 'invalid') {
    super(`photo ${reason}`);
    this.name = 'PhotoError';
    this.reason = reason;
  }
}

// Re-encodes to a JPEG of the given size (which drops EXIF, GPS, XMP and the rest), then strips and
// checks the result with the same module photo-commit and cover-commit use (docs/arsiv/SPEC_V2.md
// §5.3, docs/SPEC_V4.md §4.W). The middle of the picture is cut to the size's shape first. Nothing
// leaves the phone unless the check passes.
async function reencode(
  uri: string,
  width: number,
  height: number,
  out: { width: number; height: number; maxBytes: number },
): Promise<ArrayBuffer> {
  const ratio = out.width / out.height;
  const cropWidth = Math.min(width, Math.round(height * ratio));
  const cropHeight = Math.min(height, Math.round(cropWidth / ratio));
  let context = ImageManipulator.manipulate(uri);
  if (cropWidth !== width || cropHeight !== height) {
    context = context.crop({
      originX: Math.floor((width - cropWidth) / 2),
      originY: Math.floor((height - cropHeight) / 2),
      width: cropWidth,
      height: cropHeight,
    });
  }
  const image = await context.resize({ width: out.width, height: out.height }).renderAsync();
  // The photo's quality first; a busy picture over the limit is saved again a step lower.
  for (const compress of QUALITY_STEPS) {
    const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress, base64: true });
    if (!saved.base64) throw new PhotoError('invalid');
    const prepared = preparePhotoUpload(saved.base64, out.maxBytes);
    if (prepared.ok) return new Uint8Array(prepared.bytes).buffer;
    if (prepared.reason !== 'too_large') break;
  }
  throw new PhotoError('invalid');
}
const QUALITY_STEPS = [PHOTO_JPEG_QUALITY, 0.55, 0.4] as const;

const PHOTO_OUT = { width: PHOTO_SIZE_PX, height: PHOTO_SIZE_PX, maxBytes: PHOTO_MAX_BYTES };
const COVER_OUT = { width: COVER_WIDTH_PX, height: COVER_HEIGHT_PX, maxBytes: COVER_MAX_BYTES };

// Picks, re-encodes, uploads to a one-time signed URL and commits. False if the user cancelled.
export async function choosePhoto(source: PhotoSource): Promise<boolean> {
  const permission =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new PhotoError('permission');

  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
    exif: false,
  };
  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
  const asset = result.canceled ? undefined : result.assets[0];
  if (!asset) return false;

  const bytes = await reencode(asset.uri, asset.width, asset.height, PHOTO_OUT);
  const { path, token } = await profileApi.photoUploadUrl();
  const upload = await supabase.storage
    .from(PHOTO_BUCKET)
    .uploadToSignedUrl(path, token, bytes, { contentType: 'image/jpeg' });
  if (upload.error) throw new PhotoError('invalid');
  await profileApi.photoCommit(path);
  return true;
}

// The profile cover (docs/SPEC_V4.md §4.W): from the library only, cut 1.9:1, the photo's path
// otherwise (re-encoded, no metadata, a one-time signed URL, then cover-commit). False if the user
// cancelled.
export async function chooseCover(): Promise<boolean> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new PhotoError('permission');
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [COVER_WIDTH_PX, COVER_HEIGHT_PX],
    quality: 1,
    exif: false,
  });
  const asset = result.canceled ? undefined : result.assets[0];
  if (!asset) return false;

  const bytes = await reencode(asset.uri, asset.width, asset.height, COVER_OUT);
  const { path, token } = await profileApi.coverUploadUrl();
  const upload = await supabase.storage
    .from(PHOTO_BUCKET)
    .uploadToSignedUrl(path, token, bytes, { contentType: 'image/jpeg' });
  if (upload.error) throw new PhotoError('invalid');
  await profileApi.coverCommit(path);
  return true;
}
