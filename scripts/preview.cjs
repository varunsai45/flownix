const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../dist');
const info=JSON.parse(fs.readFileSync(path.join(root,'build-info.json'),'utf8'));
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.txt':'text/plain; charset=utf-8','.xml':'application/xml; charset=utf-8','.json':'application/json'};
const port=Number(process.env.PORT||4173);
const server=http.createServer((req,res)=>{
  if (!['GET','HEAD'].includes(req.method)) {res.writeHead(405);res.end();return;}
  let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);res.end();return;}
  if(pathname==='/index.html'){res.writeHead(301,{Location:'/'});res.end();return;}
  let file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  let status=200;
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()||['_headers','vercel.json','build-info.json'].includes(path.basename(file))){status=404;file=path.join(root,'404.html');}
  res.writeHead(status,{...info.headers,'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});
  res.end(req.method==='HEAD'?undefined:fs.readFileSync(file));
});
server.listen(port,'127.0.0.1',()=>console.log(`Flownix production-output preview: http://127.0.0.1:${port}`));
