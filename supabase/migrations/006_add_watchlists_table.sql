-- Create watchlists table
CREATE TABLE IF NOT EXISTS public.watchlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Ensure a user can't add the same symbol multiple times
    UNIQUE(user_id, symbol)
);

-- Enable RLS
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own watchlist" 
    ON public.watchlists FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own watchlist items" 
    ON public.watchlists FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own watchlist items" 
    ON public.watchlists FOR DELETE 
    USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS watchlists_user_id_idx ON public.watchlists (user_id);
