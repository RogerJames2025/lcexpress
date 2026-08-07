-- LCexpress v10.2 - Perfil automático para cualquier usuario creado en Supabase Auth
CREATE OR REPLACE FUNCTION public.crear_perfil_usuario()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.perfiles (id,nombre,apellido,email,rol,activo,creado_en,actualizado)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'nombre',''), split_part(COALESCE(NEW.email,'Usuario'),'@',1)),
    COALESCE(NEW.raw_user_meta_data ->> 'apellido',''),
    NEW.email,
    'VENDEDOR',
    TRUE,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET email=EXCLUDED.email, actualizado=NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_crear_perfil_usuario ON auth.users;
CREATE TRIGGER trg_crear_perfil_usuario
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.crear_perfil_usuario();

-- Completa perfiles faltantes de usuarios existentes.
INSERT INTO public.perfiles (id,nombre,apellido,email,rol,activo,creado_en,actualizado)
SELECT u.id,
       COALESCE(NULLIF(u.raw_user_meta_data ->> 'nombre',''), split_part(COALESCE(u.email,'Usuario'),'@',1)),
       COALESCE(u.raw_user_meta_data ->> 'apellido',''),
       u.email,'VENDEDOR',TRUE,NOW(),NOW()
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.perfiles p WHERE p.id=u.id);
