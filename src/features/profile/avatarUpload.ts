import * as ImageManipulator from "expo-image-manipulator";
import { decode } from "base64-arraybuffer";
import { supabase } from "@/lib/supabase";

const BUCKET = "avatars";
const MAX_SIZE = 768;
const QUALITY = 0.82;

function getAvatarStoragePath(url: string | null | undefined): string | null {
  if (!url) return null;

  const marker = "/storage/v1/object/public/avatars/";
  const index = url.indexOf(marker);

  if (index === -1) return null;
  return url.slice(index + marker.length);
}

export async function uploadProfileAvatar(
  photoUri: string,
  userId: string
) {
  const manipulated = await ImageManipulator.manipulateAsync(
    photoUri,
    [{ resize: { width: MAX_SIZE } }],
    {
      compress: QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    }
  );

  if (!manipulated.base64) {
    throw new Error("No se pudo preparar la imagen.");
  }

  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, decode(manipulated.base64), {
      contentType: "image/jpeg",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`No se pudo subir la imagen: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

  if (!data.publicUrl) {
    await supabase.storage.from(BUCKET).remove([path]);
    throw new Error("No se pudo obtener la URL pública del avatar.");
  }

  return data.publicUrl;
}

export async function removeProfileAvatar(avatarUrl?: string | null) {
  const path = getAvatarStoragePath(avatarUrl);
  if (!path) return;
  await supabase.storage.from(BUCKET).remove([path]);
}
