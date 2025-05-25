import { supabase } from '../supabaseClient';

export async function uploadMusicToSupabase(file, userId) {
  const filePath = `songs/${userId}/${file.name}`;
  // Upload the file
  const { error } = await supabase.storage
    .from('music') // <-- bucket name
    .upload(filePath, file, { upsert: true });

  if (error) {
    console.error('Supabase upload error:', error.message);
    throw error;
  }

  // Get the public URL
  const { data: publicUrlData } = supabase.storage
    .from('music')
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}