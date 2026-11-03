import {adminAuth,adminDb,reply} from '@/lib/supabase';
import {embedFace} from '@/lib/face';
export const runtime='nodejs';
export async function POST(req:Request){try{
 const auth=await adminAuth(req);if(!auth)return reply({error:'Unauthorized'},401);
 const body=await req.json();const images=body.images;
 if(!Array.isArray(images)||images.length<3||images.length>5)return reply({error:'Enroll 3 to 5 face samples'},400);
 const db=adminDb();const {data:employee,error:employeeError}=await db.from('employees').select('id').eq('id',body.employee_id).eq('organization_id',auth.organization_id).single();
 if(employeeError||!employee)return reply({error:'Employee not found'},404);
 const vectors=[];for(const image of images)vectors.push(await embedFace(image));
 // Re-enrollment is intentionally two-step; rollback on errors in production via transactional RPC.
 const {error:deleteError}=await db.from('face_templates').delete().eq('organization_id',auth.organization_id).eq('employee_id',employee.id);
 if(deleteError)throw deleteError;
 const {error:insertError}=await db.from('face_templates').insert(vectors.map(embedding=>({organization_id:auth.organization_id,employee_id:employee.id,embedding,model_version:'opencv-sface-v1'})));
 if(insertError)throw insertError;
 const {error:statusError}=await db.from('employees').update({face_id:'local:'+employee.id}).eq('id',employee.id).eq('organization_id',auth.organization_id);
 if(statusError)throw statusError;
 await db.from('audit_logs').insert({organization_id:auth.organization_id,actor:auth.userId,action:'face.enrolled',detail:{employee_id:employee.id,samples:images.length,model:'opencv-sface-v1'}});
 return reply({ok:true,samples:images.length});
}catch(e:any){return reply({error:e?.message||'Face enrollment failed'},400)}}
