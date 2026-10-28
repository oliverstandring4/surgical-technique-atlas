-- Operative Atlas v2: Conditions (workup) + Operations (with attending preference cards)
-- Additive only: no existing table or row is dropped.

-- 1. Conditions: workup topics within a subdivision (e.g. Endocrine > Thyroid > "Thyroid nodule")
CREATE TABLE public.conditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  subsection_id uuid REFERENCES public.subsections(id) ON DELETE SET NULL,
  title text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  history_physical text NOT NULL DEFAULT '',
  labs text NOT NULL DEFAULT '',
  imaging text NOT NULL DEFAULT '',
  data text NOT NULL DEFAULT '',
  recommendations text NOT NULL DEFAULT '',
  position int NOT NULL DEFAULT 0,
  is_shared boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Operations within a subdivision (e.g. HPB > Pancreas > "Pancreaticoduodenectomy")
CREATE TABLE public.operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  subsection_id uuid REFERENCES public.subsections(id) ON DELETE SET NULL,
  title text NOT NULL,
  approach text CHECK (approach IN ('open','laparoscopic','robotic','hybrid')),
  tags text[] NOT NULL DEFAULT '{}',
  pre_op text NOT NULL DEFAULT '',
  setup text NOT NULL DEFAULT '',
  intra_op text NOT NULL DEFAULT '',
  pearls_pitfalls text NOT NULL DEFAULT '',
  post_op text NOT NULL DEFAULT '',
  condition_ids uuid[] NOT NULL DEFAULT '{}',
  position int NOT NULL DEFAULT 0,
  is_shared boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Attending preference cards, one per attending per operation
CREATE TABLE public.preference_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  operation_id uuid NOT NULL REFERENCES public.operations(id) ON DELETE CASCADE,
  attending text NOT NULL DEFAULT '',
  hospital text NOT NULL DEFAULT '',
  positioning text NOT NULL DEFAULT '',
  instruments text NOT NULL DEFAULT '',
  sutures_drains text NOT NULL DEFAULT '',
  steps text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  position int NOT NULL DEFAULT 0,
  is_shared boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Op note templates can belong to an operation
ALTER TABLE public.op_note_templates
  ADD COLUMN operation_id uuid REFERENCES public.operations(id) ON DELETE SET NULL;

-- Same per-user security, timestamps and indexes as the existing tables
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['conditions','operations','preference_cards'] LOOP
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
CREATE INDEX preference_cards_operation_idx ON public.preference_cards (operation_id);

-- 5. New default menu structure
CREATE OR REPLACE FUNCTION public.seed_default_categories(_uid uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  cats text[] := ARRAY['HPB','GI','Endocrine','Breast','Melanoma / Sarcoma','Other'];
  subs jsonb := '{
    "HPB": ["Liver","Pancreas","Biliary"],
    "GI": ["Esophagus","Stomach","Small bowel","Colon","Rectum / Anal","Peritoneal (CRS-HIPEC)"],
    "Endocrine": ["Thyroid","Parathyroid","Adrenal"],
    "Breast": ["Benign","Malignant"],
    "Melanoma / Sarcoma": ["Melanoma","Sarcoma"],
    "Other": ["General"]
  }'::jsonb;
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

-- Re-seed existing users onto the new structure ONLY if they have no content yet
DO $$
DECLARE u uuid;
BEGIN
  FOR u IN SELECT id FROM auth.users LOOP
    IF NOT EXISTS (SELECT 1 FROM public.entries WHERE user_id = u)
       AND NOT EXISTS (SELECT 1 FROM public.op_note_templates WHERE user_id = u AND category_id IS NOT NULL)
       AND NOT EXISTS (SELECT 1 FROM public.order_sets WHERE user_id = u AND category_id IS NOT NULL) THEN
      DELETE FROM public.categories WHERE user_id = u;
      PERFORM public.seed_default_categories(u);
    END IF;
  END LOOP;
END $$;