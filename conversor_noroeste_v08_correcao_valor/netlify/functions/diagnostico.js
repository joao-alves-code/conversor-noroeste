exports.handler = async () => ({
  statusCode:200,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'},
  body:JSON.stringify({ok:true,api:'noroeste',functionDeployed:true,googleAppsScriptConfigured:Boolean(process.env.GOOGLE_APPS_SCRIPT_URL),message:'Function publicada. Teste /api/participantes para validar a conexão com a planilha.'})
});
