import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405)

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const authHeader = req.headers.get('Authorization') || ''
    if (!authHeader.startsWith('Bearer ')) return json({ error: 'Sesión no válida.' }, 401)

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false }
    })
    const { data: userData, error: userError } = await userClient.auth.getUser()
    if (userError || !userData.user) return json({ error: 'Sesión expirada o no válida.' }, 401)

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
    const { data: callerProfile, error: profileError } = await admin.from('perfiles').select('id,rol,activo').eq('id', userData.user.id).maybeSingle()
    if (profileError || !callerProfile || callerProfile.activo !== true || callerProfile.rol !== 'ADMIN') {
      return json({ error: 'Esta operación requiere un usuario ADMIN activo.' }, 403)
    }

    const body = await req.json().catch(() => ({}))
    const action = String(body.action || '')

    if (action === 'list') {
      const { data, error } = await admin.from('perfiles').select('id,nombre,apellido,email,rol,activo,vendedor_codigo,creado_en,actualizado').order('nombre').order('apellido')
      if (error) throw error
      return json({ users: data || [] })
    }

    const nombre = String(body.nombre || '').trim()
    const apellido = String(body.apellido || '').trim()
    const email = String(body.email || '').trim().toLowerCase()
    const rol = body.rol === 'ADMIN' ? 'ADMIN' : 'VENDEDOR'
    const activo = body.activo !== false
    const password = String(body.password || '')
    if (!nombre || !apellido || !email) return json({ error: 'Nombre, apellido y correo son obligatorios.' }, 400)

    if (action === 'create') {
      if (password.length < 6) return json({ error: 'La contraseña debe tener al menos 6 caracteres.' }, 400)
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email, password, email_confirm: true, user_metadata: { nombre, apellido }
      })
      if (createError || !created.user) return json({ error: createError?.message || 'No se pudo crear el usuario.' }, 400)
      const uid = created.user.id
      const now = new Date().toISOString()
      const { data: profile, error: upsertError } = await admin.from('perfiles').upsert({
        id: uid, nombre, apellido, email, rol, activo, actualizado: now
      }).select('id,nombre,apellido,email,rol,activo,vendedor_codigo,creado_en,actualizado').single()
      if (upsertError) {
        await admin.auth.admin.deleteUser(uid).catch(() => {})
        throw upsertError
      }
      return json({ user: profile })
    }

    if (action === 'update') {
      const id = String(body.id || '')
      if (!id) return json({ error: 'Falta el ID del usuario.' }, 400)
      if (id === userData.user.id && (!activo || rol !== 'ADMIN')) return json({ error: 'No puede desactivar ni quitarse a sí mismo el rol ADMIN.' }, 400)
      const authChanges: Record<string, unknown> = { email, email_confirm: true, user_metadata: { nombre, apellido } }
      if (password) {
        if (password.length < 6) return json({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' }, 400)
        authChanges.password = password
      }
      const { error: authError } = await admin.auth.admin.updateUserById(id, authChanges)
      if (authError) return json({ error: authError.message }, 400)
      const { data: profile, error } = await admin.from('perfiles').update({ nombre, apellido, email, rol, activo, actualizado: new Date().toISOString() }).eq('id', id).select('id,nombre,apellido,email,rol,activo,vendedor_codigo,creado_en,actualizado').single()
      if (error) throw error
      return json({ user: profile })
    }

    return json({ error: 'Acción no reconocida.' }, 400)
  } catch (e) {
    console.error(e)
    return json({ error: e instanceof Error ? e.message : 'Error interno.' }, 500)
  }
})
