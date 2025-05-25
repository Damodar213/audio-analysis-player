-- Create songs table in Supabase
CREATE TABLE IF NOT EXISTS public.songs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album TEXT,
  userId TEXT NOT NULL,
  fileUrl TEXT NOT NULL,
  fileName TEXT NOT NULL,
  fileSize BIGINT NOT NULL,
  uploadedAt BIGINT NOT NULL,
  genres JSONB DEFAULT '[]'::JSONB,
  analyzed BOOLEAN DEFAULT FALSE,
  
  -- Add created_at and updated_at timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows users to see only their own songs
CREATE POLICY "Users can view their own songs"
  ON public.songs
  FOR SELECT
  USING (auth.uid()::TEXT = userId);

-- Create a policy that allows users to insert their own songs
CREATE POLICY "Users can insert their own songs"
  ON public.songs
  FOR INSERT
  WITH CHECK (auth.uid()::TEXT = userId);

-- Create a policy that allows users to update their own songs
CREATE POLICY "Users can update their own songs"
  ON public.songs
  FOR UPDATE
  USING (auth.uid()::TEXT = userId);

-- Create a policy that allows users to delete their own songs
CREATE POLICY "Users can delete their own songs"
  ON public.songs
  FOR DELETE
  USING (auth.uid()::TEXT = userId);

-- Create an index on userId for faster queries
CREATE INDEX IF NOT EXISTS songs_user_id_idx ON public.songs(userId);

-- Create a trigger function to update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update updated_at
CREATE TRIGGER set_songs_updated_at
BEFORE UPDATE ON public.songs
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at(); 