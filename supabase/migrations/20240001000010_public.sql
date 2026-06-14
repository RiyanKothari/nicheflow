-- supabase/migrations/20240001000010_public.sql

CREATE TABLE public_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  tagline TEXT,
  blocks JSONB DEFAULT '[]',
  published BOOLEAN DEFAULT FALSE,
  custom_domain TEXT UNIQUE,
  meta_title TEXT,
  meta_description TEXT,
  og_image_url TEXT,
  theme JSONB DEFAULT '{"colorScheme":"light","accentColor":"#F97316"}',
  settings JSONB DEFAULT '{}',
  views_count INTEGER DEFAULT 0,
  bookings_from_page INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  public_page_id UUID REFERENCES public_pages(id) ON DELETE CASCADE,
  reviewer_name TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  content TEXT,
  owner_reply TEXT,
  owner_reply_draft TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  review_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(12), 'hex'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reviews_workspace ON reviews(workspace_id, is_published);
CREATE INDEX idx_reviews_token ON reviews(review_token);