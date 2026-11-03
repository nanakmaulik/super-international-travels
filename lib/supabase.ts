import {createClient} from '@supabase/supabase-js';
export const publicDb=()=>createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
export const adminDb=()=>createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{autoRefreshToken:false,persistSession:false}});
export async function adminAuth(request:Request){const bearer=request.headers.get('authorization')?.replace(/^Bearer\s+/i,'');if(!bearer)return null;const db=adminDb();const {data:{user},error}=await db.auth.getUser(bearer);if(error||!user)return null;const {data}=await db.from('organization_members').select('organization_id,role').eq('user_id',user.id).in('role',['owner','admin']).limit(1).maybeSingle();return data?{...data,userId:user.id}:null;}
export const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
