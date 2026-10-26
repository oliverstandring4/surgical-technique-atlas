CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  position int NOT NULL DEFAULT 0,
  is_shared boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.subsections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  subsection_id uuid REFERENCES public.subsections(id) ON DELETE SET NULL,
  attending text NOT NULL DEFAULT '',
  hospital text NOT NULL DEFAULT '',
  performed_month int CHECK (performed_month BETWEEN 1 AND 12),
  performed_year int,
  approach text CHECK (approach IN ('open','laparoscopic','robotic','hybrid')),
  tags text[] NOT NULL DEFAULT '{}',
  indications text NOT NULL DEFAULT '',
  setup text NOT NULL DEFAULT '',
  key_steps text NOT NULL DEFAULT '',
  pearls text NOT NULL DEFAULT '',
  pitfalls text NOT NULL DEFAULT '',
  is_shared boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.op_note_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  body text NOT NULL DEFAULT '',
  is_shared boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.dot_phrases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  expansion text NOT NULL DEFAULT '',
  is_shared boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.order_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  procedure text NOT NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  diet text NOT NULL DEFAULT '',
  drains text NOT NULL DEFAULT '',
  labs text NOT NULL DEFAULT '',
  vte text NOT NULL DEFAULT '',
  pain text NOT NULL DEFAULT '',
  eras text NOT NULL DEFAULT '',
  activity text NOT NULL DEFAULT '',
  discharge text NOT NULL DEFAULT '',
  variations text NOT NULL DEFAULT '',
  linked_entry_ids uuid[] NOT NULL DEFAULT '{}',
  is_shared boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.saved_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL,
  url text NOT NULL,
  note text NOT NULL DEFAULT '',
  position int NOT NULL DEFAULT 0,
  is_shared boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['categories','subsections','entries','op_note_templates','dot_phrases','order_sets','saved_links'] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "Own rows select" ON public.%I FOR SELECT TO authenticated USING (auth.uid() = user_id)', t);
    EXECUTE format('CREATE POLICY "Own rows insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)', t);
    EXECUTE format('CREATE POLICY "Own rows update" ON public.%I FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)', t);
    EXECUTE format('CREATE POLICY "Own rows delete" ON public.%I FOR DELETE TO authenticated USING (auth.uid() = user_id)', t);
    EXECUTE format('CREATE TRIGGER touch_%I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at()', t, t);
    EXECUTE format('CREATE INDEX %I ON public.%I (user_id)', t || '_user_idx', t);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.seed_default_categories(_uid uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  cats text[] := ARRAY['HPB','Upper GI','Colorectal','Peritoneal / CRS-HIPEC','Breast','Melanoma / Sarcoma','Endocrine','Other'];
  subs jsonb := '{"HPB":["Liver","Pancreas","Biliary"],"Upper GI":["Esophagus","Stomach"],"Colorectal":["Colon","Rectum","Anal"]}'::jsonb;
  i int; cid uuid; s text; j int;
BEGIN
  IF EXISTS (SELECT 1 FROM public.categories WHERE user_id = _uid) THEN RETURN; END IF;
  FOR i IN 1..array_length(cats,1) LOOP
    INSERT INTO public.categories(user_id,name,position) VALUES (_uid,cats[i],i) RETURNING id INTO cid;
    j := 0;
    FOR s IN SELECT jsonb_array_elements_text(COALESCE(subs->cats[i],'[]'::jsonb)) LOOP
      j := j + 1;
      INSERT INTO public.subsections(user_id,category_id,name,position) VALUES (_uid,cid,s,j);
    END LOOP;
  END LOOP;
END; $$;
REVOKE EXECUTE ON FUNCTION public.seed_default_categories(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user_seed() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN PERFORM public.seed_default_categories(NEW.id); RETURN NEW; END; $$;
CREATE TRIGGER on_auth_user_created_seed AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_seed();

-- Seed any existing users
SELECT public.seed_default_categories(id) FROM auth.users;