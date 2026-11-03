import {createHash} from 'node:crypto';
import {adminDb,reply} from '@/lib/supabase';
export const runtime='nodejs';
export async function POST(req:Request){
 try{
  const body=await req.json();
  const token=typeof body.token==='string'?body.token.trim():'';
  if(!/^[a-fA-F0-9]{64}$/.test(token))return reply({error:'Enter a valid device activation key.'},400);
  const hash=createHash('sha256').update(token.toLowerCase()).digest('hex');
  const db=adminDb();
  const {data,error}=await db.from('kiosks').select('id,name,organization_id').eq('token_hash',hash).eq('active',true).maybeSingle();
  if(error)throw error;
  if(!data)return reply({error:'Device key is invalid or revoked. Ask your company administrator.'},401);
  const {data:org}=await db.from('organizations').select('name').eq('id',data.organization_id).maybeSingle();
  return reply({ok:true,device:{name:data.name,organization:org?.name||'Your company'}});
 }catch{return reply({error:'Could not authorize device.'},400)}
}
