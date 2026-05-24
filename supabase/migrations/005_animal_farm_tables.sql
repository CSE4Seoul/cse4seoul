-- Create animal_farm_profiles table
CREATE TABLE IF NOT EXISTS public.animal_farm_profiles (
  id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  points integer DEFAULT 1000 NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.animal_farm_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for animal_farm_profiles
CREATE POLICY "Users can view their own farm profile"
  ON public.animal_farm_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own farm profile"
  ON public.animal_farm_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create animals table
CREATE TABLE IF NOT EXISTS public.animals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  species text NOT NULL,
  level integer DEFAULT 1 NOT NULL,
  exp integer DEFAULT 0 NOT NULL,
  hunger integer DEFAULT 100 NOT NULL,
  status text DEFAULT 'IDLE' NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.animals ENABLE ROW LEVEL SECURITY;

-- Policies for animals
CREATE POLICY "Users can view their own animals"
  ON public.animals FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can update their own animals"
  ON public.animals FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own animals"
  ON public.animals FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own animals"
  ON public.animals FOR DELETE
  USING (auth.uid() = owner_id);

-- Create inventory table
CREATE TABLE IF NOT EXISTS public.animal_farm_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_id text NOT NULL,
  quantity integer DEFAULT 1 NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, item_id)
);

-- Enable RLS
ALTER TABLE public.animal_farm_inventory ENABLE ROW LEVEL SECURITY;

-- Policies for inventory
CREATE POLICY "Users can view their own inventory"
  ON public.animal_farm_inventory FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own inventory"
  ON public.animal_farm_inventory FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into their own inventory"
  ON public.animal_farm_inventory FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_animal_farm_profiles_updated_at ON public.animal_farm_profiles;
CREATE TRIGGER update_animal_farm_profiles_updated_at BEFORE UPDATE ON public.animal_farm_profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_animals_updated_at ON public.animals;
CREATE TRIGGER update_animals_updated_at BEFORE UPDATE ON public.animals FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_animal_farm_inventory_updated_at ON public.animal_farm_inventory;
CREATE TRIGGER update_animal_farm_inventory_updated_at BEFORE UPDATE ON public.animal_farm_inventory FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Function to automatically create animal_farm_profile when profile is created
CREATE OR REPLACE FUNCTION public.handle_new_animal_farm_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.animal_farm_profiles (id, points)
  VALUES (NEW.id, 1000)
  ON CONFLICT (id) DO NOTHING;
  
  -- Optionally add a default animal
  INSERT INTO public.animals (owner_id, name, species)
  VALUES (NEW.id, '새내기', 'chick')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- Trigger on public.profiles
DROP TRIGGER IF EXISTS on_profile_created_animal_farm ON public.profiles;
CREATE TRIGGER on_profile_created_animal_farm
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_animal_farm_user();

-- Seed existing users
INSERT INTO public.animal_farm_profiles (id, points)
SELECT id, 1000 FROM public.profiles
ON CONFLICT (id) DO NOTHING;

-- Seed default animals for existing users if they don't have any
INSERT INTO public.animals (owner_id, name, species)
SELECT id, '새내기', 'chick' 
FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM public.animals a WHERE a.owner_id = p.id)
ON CONFLICT DO NOTHING;
