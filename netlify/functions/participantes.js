// Netlify Functions: gateway para Google Apps Script. Node >=18.
const respond = (code, data) => ({statusCode:code, headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}, body:JSON.stringify(data)});
const validURL = (value) => {try{const u=new URL(value);return u.protocol==='https:' && u.hostname==='script.google.com' && /^\/macros\/s\/[^/]+\/exec\/?$/.test(u.pathname)}catch{return false}};
exports.handler=async (event) => {
  if(!['GET','POST'].includes(event.httpMethod))return respond(405,{ok:false,error:'Método não permitido'});
  const url=process.env.GOOGLE_APPS_SCRIPT_URL?.trim();
  if(!validURL(url))return respond(503,{ok:false,error:'GOOGLE_APPS_SCRIPT_URL não configurada ou inválida no Netlify.'});
  const opts={redirect:'follow',signal:AbortSignal.timeout(25000)};
  let endpoint=url;
  if(event.httpMethod==='GET') {const u=new URL(url);u.searchParams.set('action','list');endpoint=u.toString();opts.method='GET'}
  else {
    let p;try{p=JSON.parse(event.body||'{}')}catch{return respond(400,{ok:false,error:'JSON inválido'})}
    const name=String(p.name||'').trim(), account=String(p.account||'').trim(), description=String(p.description||'').trim();
    if(p.action!=='upsert'||!name||name.length>240||!/^\d{1,25}$/.test(account)||description.length>500)return respond(400,{ok:false,error:'Dados do participante inválidos'});
    opts.method='POST';opts.headers={'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8'};
    opts.body=new URLSearchParams({action:'upsert',name,account,description}).toString();
  }
  try {
    const r=await fetch(endpoint,opts);
    if(!r.ok)return respond(502,{ok:false,error:`Google Apps Script respondeu HTTP ${r.status}; confirme a implantação /exec e as permissões.`});
    const raw=await r.text();let data;try{data=JSON.parse(raw)}catch{return respond(502,{ok:false,error:'O Apps Script não devolveu JSON. Talvez esteja redirecionando para autenticação. Revise a URL /exec e as permissões.'})}
    if(data?.ok!==true)return respond(502,{ok:false,error:String(data?.error||'Erro de execução no Google Apps Script')});
    if(event.httpMethod==='GET'&&!Array.isArray(data.items))return respond(502,{ok:false,error:'A API não retornou a lista de participantes.'});
    return respond(200,data);
  } catch(err){return respond(502,{ok:false,error:'Falha na comunicação com o Google: '+String(err.message||err)})}
};
