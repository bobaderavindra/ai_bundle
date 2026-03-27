-- Recipe Chatbot - PostgreSQL schema
-- Assumes the database is already created and you have privileges to create extensions/tables.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users: reuse app_user from settleup_schema.sql

-- Conversations
CREATE TABLE IF NOT EXISTS chatbot_conversation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES app_user(id) ON DELETE SET NULL,
  title TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Messages (user + assistant)
CREATE TABLE IF NOT EXISTS chatbot_message (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES chatbot_conversation(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('USER', 'ASSISTANT', 'SYSTEM')),
  content TEXT NOT NULL,
  token_count INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Recipe entity (optional: persists generated recipes)
CREATE TABLE IF NOT EXISTS recipe (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES app_user(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  cuisine TEXT,
  servings INT,
  prep_time_minutes INT,
  cook_time_minutes INT,
  instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Recipe ingredients (normalized)
CREATE TABLE IF NOT EXISTS recipe_ingredient (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL REFERENCES recipe(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity TEXT,
  unit TEXT
);

-- Ingredient knowledge base (for suggestions/auto-complete)
CREATE TABLE IF NOT EXISTS ingredient (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pantry entries (per user)
CREATE TABLE IF NOT EXISTS pantry_item (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredient(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  quantity TEXT,
  unit TEXT,
  expires_on DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User preferences (dietary, allergens, favorites)
CREATE TABLE IF NOT EXISTS user_preference (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, key)
);

-- RAG sources / document ingestion
CREATE TABLE IF NOT EXISTS recipe_source (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES app_user(id) ON DELETE SET NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('URL', 'FILE', 'NOTE')),
  source_uri TEXT,
  title TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Link between recipes and sources
CREATE TABLE IF NOT EXISTS recipe_source_link (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL REFERENCES recipe(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES recipe_source(id) ON DELETE CASCADE,
  UNIQUE (recipe_id, source_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_chatbot_conversation_user ON chatbot_conversation(user_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_message_conversation ON chatbot_message(conversation_id);
CREATE INDEX IF NOT EXISTS idx_recipe_user ON recipe(user_id);
CREATE INDEX IF NOT EXISTS idx_pantry_user ON pantry_item(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_source_user ON recipe_source(user_id);

-- ============================================================================
-- updated_at triggers
-- ============================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_chatbot_conversation_updated_at
BEFORE UPDATE ON chatbot_conversation
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- Row-level security (RLS)
-- Assumes the application sets: SET app.user_id = '<uuid>';
-- ============================================================================
CREATE OR REPLACE FUNCTION current_app_user_id()
RETURNS UUID AS $$
  SELECT NULLIF(current_setting('app.user_id', true), '')::uuid;
$$ LANGUAGE sql STABLE;

ALTER TABLE chatbot_conversation ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_message ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredient ENABLE ROW LEVEL SECURITY;
ALTER TABLE pantry_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preference ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_source ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_source_link ENABLE ROW LEVEL SECURITY;

-- Conversations: user can read/write own
CREATE POLICY chatbot_conversation_select_self ON chatbot_conversation
  FOR SELECT USING (user_id = current_app_user_id());

CREATE POLICY chatbot_conversation_insert_self ON chatbot_conversation
  FOR INSERT WITH CHECK (user_id = current_app_user_id());

CREATE POLICY chatbot_conversation_update_self ON chatbot_conversation
  FOR UPDATE USING (user_id = current_app_user_id());

CREATE POLICY chatbot_conversation_delete_self ON chatbot_conversation
  FOR DELETE USING (user_id = current_app_user_id());

-- Messages: user can access messages in their conversations
CREATE POLICY chatbot_message_select_self ON chatbot_message
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chatbot_conversation c
      WHERE c.id = chatbot_message.conversation_id
        AND c.user_id = current_app_user_id()
    )
  );

CREATE POLICY chatbot_message_insert_self ON chatbot_message
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM chatbot_conversation c
      WHERE c.id = chatbot_message.conversation_id
        AND c.user_id = current_app_user_id()
    )
  );

-- Recipes: user owns recipes
CREATE POLICY recipe_select_self ON recipe
  FOR SELECT USING (user_id = current_app_user_id());

CREATE POLICY recipe_insert_self ON recipe
  FOR INSERT WITH CHECK (user_id = current_app_user_id());

CREATE POLICY recipe_update_self ON recipe
  FOR UPDATE USING (user_id = current_app_user_id());

CREATE POLICY recipe_delete_self ON recipe
  FOR DELETE USING (user_id = current_app_user_id());

-- Recipe ingredients inherit recipe ownership
CREATE POLICY recipe_ingredient_select_self ON recipe_ingredient
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recipe r
      WHERE r.id = recipe_ingredient.recipe_id
        AND r.user_id = current_app_user_id()
    )
  );

CREATE POLICY recipe_ingredient_insert_self ON recipe_ingredient
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipe r
      WHERE r.id = recipe_ingredient.recipe_id
        AND r.user_id = current_app_user_id()
    )
  );

CREATE POLICY recipe_ingredient_update_self ON recipe_ingredient
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM recipe r
      WHERE r.id = recipe_ingredient.recipe_id
        AND r.user_id = current_app_user_id()
    )
  );

CREATE POLICY recipe_ingredient_delete_self ON recipe_ingredient
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM recipe r
      WHERE r.id = recipe_ingredient.recipe_id
        AND r.user_id = current_app_user_id()
    )
  );

-- Pantry: user owns items
CREATE POLICY pantry_item_select_self ON pantry_item
  FOR SELECT USING (user_id = current_app_user_id());

CREATE POLICY pantry_item_insert_self ON pantry_item
  FOR INSERT WITH CHECK (user_id = current_app_user_id());

CREATE POLICY pantry_item_update_self ON pantry_item
  FOR UPDATE USING (user_id = current_app_user_id());

CREATE POLICY pantry_item_delete_self ON pantry_item
  FOR DELETE USING (user_id = current_app_user_id());

-- Preferences: user owns preferences
CREATE POLICY user_preference_select_self ON user_preference
  FOR SELECT USING (user_id = current_app_user_id());

CREATE POLICY user_preference_insert_self ON user_preference
  FOR INSERT WITH CHECK (user_id = current_app_user_id());

CREATE POLICY user_preference_update_self ON user_preference
  FOR UPDATE USING (user_id = current_app_user_id());

CREATE POLICY user_preference_delete_self ON user_preference
  FOR DELETE USING (user_id = current_app_user_id());

-- Sources: user owns sources
CREATE POLICY recipe_source_select_self ON recipe_source
  FOR SELECT USING (user_id = current_app_user_id());

CREATE POLICY recipe_source_insert_self ON recipe_source
  FOR INSERT WITH CHECK (user_id = current_app_user_id());

CREATE POLICY recipe_source_update_self ON recipe_source
  FOR UPDATE USING (user_id = current_app_user_id());

CREATE POLICY recipe_source_delete_self ON recipe_source
  FOR DELETE USING (user_id = current_app_user_id());

-- Source links inherit recipe ownership
CREATE POLICY recipe_source_link_select_self ON recipe_source_link
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recipe r
      WHERE r.id = recipe_source_link.recipe_id
        AND r.user_id = current_app_user_id()
    )
  );

CREATE POLICY recipe_source_link_insert_self ON recipe_source_link
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipe r
      WHERE r.id = recipe_source_link.recipe_id
        AND r.user_id = current_app_user_id()
    )
  );

CREATE POLICY recipe_source_link_delete_self ON recipe_source_link
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM recipe r
      WHERE r.id = recipe_source_link.recipe_id
        AND r.user_id = current_app_user_id()
    )
  );
