import { api, ApiError, type ContentItem, type MediaItem } from './emdash-api';
const form=document.querySelector<HTMLFormElement>('#review-form')!;
const status=document.querySelector<HTMLParagraphElement>('#editor-status')!;
const panels=[...document.querySelectorAll<HTMLElement>('[data-panel]')];
const steps=[...document.querySelectorAll<HTMLButtonElement>('[data-step]')];
const back=document.querySelector<HTMLButtonElement>('#back')!;
const next=document.querySelector<HTMLButtonElement>('#next')!;
const save=document.querySelector<HTMLButtonElement>('#save')!;
const publish=document.querySelector<HTMLButtonElement>('#publish')!;
const preview=document.querySelector<HTMLDivElement>('#review-preview')!;
const fields=['title','author','illustrator','genre','age_range','summary','favourite_character','favourite_part','feelings','change','recommendation','drawing_caption'];
const images:Record<string,MediaItem|null>={cover:null,drawing:null};
const selectedFiles:Record<string,File|undefined>={};
const previewUrls:Record<string,string|undefined>={};
let item:ContentItem|undefined;
let currentStep=0;
let dirty=false;
let saving=false;
let loaded=true;
function input(name:string){return form.elements.namedItem(name) as HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement;}
function message(text:string,error=false){status.textContent=text;status.dataset.error=String(error);}
function showStep(index:number,focus=true){
 currentStep=index;panels.forEach((panel,i)=>panel.hidden=i!==index);
 steps.forEach((step,i)=>i===index?step.setAttribute('aria-current','step'):step.removeAttribute('aria-current'));
 back.hidden=index===0;next.hidden=index===2;publish.hidden=index!==2||form.dataset.canPublish!=='true';
 if(index===2)renderPreview();
 if(focus)panels[index].querySelector<HTMLElement>('h2')?.focus();
}
function data(){
 const result:Record<string,unknown>={};
 fields.forEach(name=>{const value=input(name).value.trim();result[name]=value||null;});
 result.title=input('title').value.trim();
 const rating=form.querySelector<HTMLInputElement>('input[name=rating]:checked');result.rating=rating?Number(rating.value):null;
 const date=input('read_on').value;result.read_on=date?new Date(date+'T12:00:00Z').toISOString():null;
 result.contains_spoilers=(input('contains_spoilers') as HTMLInputElement).checked;
 result.is_sample=(input('is_sample') as HTMLInputElement).checked;
 result.cover=images.cover?mediaValue(images.cover):null;result.drawing=images.drawing?mediaValue(images.drawing):null;
 return result;
}
function mediaValue(media:MediaItem){return {id:media.id,src:media.url||'/_emdash/api/media/file/'+media.id,alt:media.alt||'',width:media.width,height:media.height,provider:'local',meta:{storageKey:media.storageKey}};}
function renderPreview(){
 const values=data();preview.replaceChildren();
 const title=document.createElement('h3');title.textContent=String(values.title||'Your book title');preview.append(title);
 const author=document.createElement('p');author.textContent=values.author?'by '+values.author:'';preview.append(author);
 const rating=document.createElement('p');rating.textContent=values.rating?'★'.repeat(Number(values.rating))+' · '+values.rating+' out of 5 stars':'';preview.append(rating);
 const list=document.createElement('dl');
 const labels:Record<string,string>={summary:'What’s the story?',favourite_character:'My favourite character',favourite_part:'My favourite part',feelings:'How it made me feel',change:'One thing I would change',recommendation:'Who would love this book?',drawing_caption:'About my drawing'};
 Object.entries(labels).forEach(([field,label])=>{if(values[field]){const dt=document.createElement('dt');dt.textContent=label;const dd=document.createElement('dd');dd.textContent=String(values[field]);list.append(dt,dd);}});preview.append(list);
}
function showImage(name:string,src?:string){
 const img=document.querySelector<HTMLImageElement>('#'+name+'-preview')!;img.hidden=!src;if(src)img.src=src;else img.removeAttribute('src');
 form.querySelector<HTMLButtonElement>('[data-remove='+name+']')!.hidden=!src;
}
for(const name of ['cover','drawing']){
 const fileInput=document.querySelector<HTMLInputElement>('#'+name+'-file')!;
 fileInput.addEventListener('change',()=>{
  const file=fileInput.files?.[0];if(!file)return;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)){fileInput.value='';message('Choose a JPG, PNG or WebP image.',true);return;}
  if(file.size>10*1024*1024){fileInput.value='';message('This image is too large. Choose one smaller than 10 MB.',true);return;}
  if(previewUrls[name])URL.revokeObjectURL(previewUrls[name]!);
  selectedFiles[name]=file;previewUrls[name]=URL.createObjectURL(file);showImage(name,previewUrls[name]);dirty=true;message('Image chosen. Save your draft to keep it.');
 });
 form.querySelector<HTMLButtonElement>('[data-remove='+name+']')!.addEventListener('click',()=>{
  images[name]=null;selectedFiles[name]=undefined;fileInput.value='';if(previewUrls[name])URL.revokeObjectURL(previewUrls[name]!);showImage(name);dirty=true;message('Image removed. Save your draft to keep this change.');
 });
}
async function uploadImages(){
 for(const name of ['cover','drawing']){
  const file=selectedFiles[name];if(!file)continue;
  message(name==='cover'?'Saving your book cover…':'Saving your drawing…');
  const body=new FormData();body.append('file',file);body.append('alt',name==='cover'?'Cover of '+input('title').value:input('drawing_caption').value||'My drawing about '+input('title').value);
  const uploaded=await api('/media',{method:'POST',body});images[name]=uploaded.item as unknown as MediaItem;selectedFiles[name]=undefined;
 }
}
function validate(publishing:boolean){
 const required=publishing?[['title',0,'Add the book title first.'],['author',0,'Add the author’s name before sharing.'],['summary',1,'Tell us a little about the story before sharing.'],['recommendation',1,'Tell us who you would recommend it to before sharing.']]:[['title',0,'Add the book title before saving.']];
 for(const [name,step,text] of required){if(!input(String(name)).value.trim()){showStep(Number(step),false);input(String(name)).focus();message(String(text),true);return false;}}
 if(publishing&&!form.querySelector('input[name=rating]:checked')){showStep(1,false);form.querySelector<HTMLInputElement>('input[name=rating]')!.focus();message('Choose your star rating before sharing.',true);return false;}
 return true;
}
async function persist(publishing=false){
 if(saving||!loaded)return;
 if(form.dataset.canWrite!=='true'){message('Log in before saving. Your words are still here.',true);return;}
 if(!validate(publishing))return;
 saving=true;form.querySelectorAll<HTMLButtonElement|HTMLInputElement>('button,input[type=file]').forEach(el=>el.disabled=true);
 try{
  await uploadImages();message('Saving your words…');
  const body=item?{data:data(),_rev:item._rev}:{data:data(),status:'draft',slug:input('title').value.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80)+'-'+Date.now().toString(36)};
  const result=await api('/content/reviews'+(item?'/'+encodeURIComponent(item.id):''),{method:item?'PUT':'POST',body:JSON.stringify(body)});
  item=result.item!;
  if(!item?.id)throw new Error('Missing saved review');
  history.replaceState(null,'','/write?id='+encodeURIComponent(item.id));
  // Reload the saved revision so the next edit has the server's current token.
  item=(await api('/content/reviews/'+encodeURIComponent(item.id))).item!;
  dirty=false;
  if(publishing){
   message('Adding your review to the bookshelf…');
   const published=await api('/content/reviews/'+encodeURIComponent(item.id)+'/publish',{method:'POST',body:JSON.stringify({_rev:item._rev})});
   const slug=published.item?.slug||item.slug;window.location.assign('/reviews/'+encodeURIComponent(slug!));
  }else message('Draft saved. You can find it in My drafts.');
 }catch(error){
  if(error instanceof ApiError){
   if(error.status===401)message('Your session has ended. Log in again to save your review. Your words are still here.',true);
   else if(error.status===403)message('Your account cannot make this change. Keep your draft and contact an editor.',true);
   else if(error.code==='CONFLICT'||error.code==='ENTRY_LOCKED')message('This review is open or has changed elsewhere. Keep this page open and check the latest version before saving again.',true);
   else if(error.status===413)message('The image is too large. Choose a smaller image and try again.',true);
   else message('Your review couldn’t be saved. Your words are still here. Try again.',true);
  }else message('We couldn’t finish saving. Check your connection and try again. Your words are still here.',true);
 }finally{saving=false;form.querySelectorAll<HTMLButtonElement|HTMLInputElement>('button,input[type=file]').forEach(el=>el.disabled=false);}
}
form.addEventListener('input',()=>{dirty=true;if(currentStep===2)renderPreview();});
form.addEventListener('submit',event=>event.preventDefault());
steps.forEach((step,i)=>step.addEventListener('click',()=>showStep(i)));
next.addEventListener('click',()=>showStep(currentStep+1));back.addEventListener('click',()=>showStep(currentStep-1));
save.addEventListener('click',()=>persist());publish.addEventListener('click',()=>persist(true));
window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();}});
const id=new URLSearchParams(location.search).get('id');
if(id){
 loaded=false;
 try{
  item=(await api('/content/reviews/'+encodeURIComponent(id))).item!;
  fields.forEach(name=>input(name).value=String(item!.data[name]||''));
  input('read_on').value=String(item.data.read_on||'').slice(0,10);
  const rating=form.querySelector<HTMLInputElement>('input[name=rating][value="'+item.data.rating+'"]');if(rating)rating.checked=true;
  (input('contains_spoilers') as HTMLInputElement).checked=Boolean(item.data.contains_spoilers);
  (input('is_sample') as HTMLInputElement).checked=Boolean(item.data.is_sample);
  document.querySelector<HTMLElement>('#sample-control')!.hidden=!item.data.is_sample;
  for(const name of ['cover','drawing']){const image=item.data[name] as {id:string;src?:string;alt?:string}|undefined;images[name]=image?{...image,url:image.src,filename:''}:null;showImage(name,image?.src);}
  if(item.status==='published')message('You’re editing a shared review. Save draft keeps changes private until you add them to your bookshelf.');
  loaded=true;
 }catch{message('We couldn’t open this review. Sign in and refresh this page to try again.',true);save.disabled=true;publish.disabled=true;}
}
