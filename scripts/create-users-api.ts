// Script para crear usuarios usando la Edge Function
const SUPABASE_URL = 'https://yithnwgzzdhxecghzmjl.supabase.co';
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/create-admin-user`;
const SECRET_KEY = 'AMMI_SUPER_SECRET_2026';
const COMPANY_ID = 'ef0cbe1b-06be-4587-a9a3-6233c14795f5'; // PLIHSA

const users = [
  {
    email: 'karla.sagastume@plihsa.com',
    password: 'Temporal2026',
    role: 'admin'
  },
  {
    email: 'Andrea.fuentes@plihsa.com',
    password: 'Temporal2026',
    role: 'admin'
  },
  {
    email: 'practicante@plihsa.com',
    password: 'Temporal2026',
    role: 'user'
  }
];

async function createUser(email: string, password: string, role: string) {
  try {
    console.log(`\nCreando usuario: ${email}...`);

    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        companyId: COMPANY_ID,
        role,
        secretKey: SECRET_KEY
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`✅ Usuario ${email} creado exitosamente`);
      console.log(`   User ID: ${data.userId}`);
    } else {
      console.error(`❌ Error al crear ${email}:`, data.error);
    }
  } catch (error) {
    console.error(`❌ Error de red al crear ${email}:`, error);
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('CREACIÓN DE USUARIOS DEL SISTEMA PLIHSA');
  console.log('='.repeat(60));

  for (const user of users) {
    await createUser(user.email, user.password, user.role);
    // Pequeña pausa entre usuarios
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n' + '='.repeat(60));
  console.log('PROCESO COMPLETADO');
  console.log('='.repeat(60));
}

main();
