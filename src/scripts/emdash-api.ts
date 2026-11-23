export interface ContentItem { id:string; slug:string|null; _rev:string; data:Record<string,unknown>; updatedAt:string; status:string; draftRevisionId?:string|null; }
export interface MediaItem { id:string; url?:string; filename:string; alt?:string; width?:number; height?:number; storageKey?:string; }
interface ApiData { item?:ContentItem; items?:ContentItem[]; [key:string]:unknown; }
export class ApiError extends Error { constructor(public code:string,message:string,public status:number){super(message);} }
export async function api(path:string,options:RequestInit={}):Promise<ApiData>{
 const response=await fetch('/_emdash/api'+path,{...options,credentials:'same-origin',headers:{'X-EmDash-Request':'1',...(!(options.body instanceof FormData)&&options.body?{'Content-Type':'application/json'}:{}),...options.headers}});
 const result=await response.json().catch(()=>null);
 if(!response.ok||!result?.success) throw new ApiError(result?.error?.code||'REQUEST_FAILED',result?.error?.message||'Request failed',response.status);
 return result.data;
}
