/**
 * Script para crear usuarios iniciales del sistema
 * Ejecutar con: npx tsx scripts/create-initial-users.ts
 */

import { createClient } from '@supabase/supabase-js';

// Cargar variables de entorno
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

interface UserToCreate {
  email: string;
  password: string;
  role: 'admin';
  company: 'PLIHSA' | 'AMMI';
}

const usersToCreate: UserToCreate[] = [
  {
    email: 'karla.sagastume@plihsa.com',
    password: 'Temporal2026',
    role: 'admin',
    company: 'PLIHSA',
  },
  {
    email: 'Andrea.fuentes@plihsa.com',
    password: 'Temporal2026',
    role: 'admin',
    company: 'PLIHSA',
  },
  {
    email: 'dev@ammi.com',
    password: 'Temporal2026',
    role: 'admin',
    company: 'AMMI',
  },
];

async function getCompanyId(companyCode: string): Promise<string | null> {
  const { data } = await supabase
    .from('companies')
    .select('id')
    .eq('code', companyCode)
    .single();

  return data?.id || null;
}

async function createUser(userData: UserToCreate) {
  console.log(`\nCreando usuario: ${userData.email}`);

  try {
    // Obtener company_id
    const companyId = await getCompanyId(userData.company);
    if (!companyId) {
      throw new Error(`No se encontró la empresa: ${userData.company}`);
    }

    // Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
    });

    if (authError) {
      throw authError;
    }

    if (!authData.user) {
      throw new Error('No se pudo crear el usuario en auth');
    }

    console.log(`✓ Usuario creado en auth: ${authData.user.id}`);

    // Crear registro en system_users
    const { error: systemUserError } = await supabase.from('system_users').insert({
      user_id: authData.user.id,
      company_id: companyId,
      role: userData.role,
      is_active: true,
    });

    if (systemUserError) {
      // Si falla, intentar eliminar el usuario de auth
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw systemUserError;
    }

    console.log(`✓ Usuario registrado en system_users con rol: ${userData.role}`);
    console.log(`✓ Usuario ${userData.email} creado exitosamente`);
  } catch (error: any) {
    if (error.message?.includes('already been registered')) {
      console.log(`⚠ El usuario ${userData.email} ya existe`);
    } else {
      console.error(`✗ Error creando usuario ${userData.email}:`, error.message);
    }
  }
}

async function main() {
  console.log('=================================================');
  console.log('Creando usuarios iniciales del sistema');
  console.log('=================================================');

  for (const user of usersToCreate) {
    await createUser(user);
  }

  console.log('\n=================================================');
  console.log('Proceso completado');
  console.log('=================================================\n');
}

main().catch(console.error);
