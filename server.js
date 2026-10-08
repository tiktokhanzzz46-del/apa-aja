const http=require("http");
const fs=require("fs");
const path=require("path");
const crypto=require("crypto");

const PORT=process.env.PORT||3000;
const ADMIN_PASSWORD=process.env.ADMIN_PASSWORD||"NalaNeo";
const PUBLIC=path.join(__dirname,"public");
const sessions=new Set();

function send(res,status,data,type="application/json"){
  res.writeHead(status,{"Content-Type":type,"Cache-Control":"no-store"});
  res.end(type==="application/json"?JSON.stringify(data):data);
}
function json(req){
  return new Promise((resolve,reject)=>{
    let b="";
    req.on("data",c=>b+=c);
    req.on("end",()=>{try{resolve(b?JSON.parse(b):{})}catch(e){reject(e)}});
  });
}
function cookie(req){
  const raw=req.headers.cookie||"";
  const m=raw.match(/session=([^;]+)/);
  return m?m[1]:null;
}
function authed(req){return sessions.has(cookie(req))}
function mime(file){
  const e=path.extname(file).toLowerCase();
  return ({".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"application/javascript; charset=utf-8"})[e]||"application/octet-stream";
}

const server=http.createServer(async(req,res)=>{
  try{
    if(req.method==="POST"&&req.url==="/admin/login"){
      const b=await json(req);
      if(b.password!==ADMIN_PASSWORD)return send(res,401,{ok:false});
      const token=crypto.randomBytes(24).toString("hex");
      sessions.add(token);
      res.writeHead(200,{"Content-Type":"application/json","Set-Cookie":`session=${token}; HttpOnly; SameSite=Lax; Path=/`,"Cache-Control":"no-store"});
      return res.end(JSON.stringify({ok:true}));
    }

    if(req.method==="POST"&&req.url==="/admin/logout"){
      const t=cookie(req); if(t)sessions.delete(t);
      return send(res,200,{ok:true});
    }

    if(req.method==="GET"&&req.url==="/health"){
      return send(res,200,{ok:true,service:"NalaNeo Backend",status:"online",time:new Date().toISOString()});
    }

    if(req.url.startsWith("/test/")&&req.method==="POST"){
      if(!authed(req))return send(res,401,{ok:false,error:"Admin login required"});
      const service=req.url.split("/")[2];
      const allowed=["tiktok","youtube","instagram","spotify"];
      if(!allowed.includes(service))return send(res,404,{ok:false});
      /*
        Ini sengaja hanya health/test endpoint.
        Tidak ada API downloader pihak ketiga di sini.
        Resolver media dapat ditambahkan nanti untuk konten yang memang
        boleh diakses/download oleh pengguna.
      */
      return send(res,200,{ok:true,service,status:"backend-route-ready",message:`Route ${service} aktif.`});
    }

    let file=req.url==="/"?"/index.html":req.url;
    if(file.includes(".."))return send(res,400,{error:"Bad path"});
    const full=path.join(PUBLIC,file);
    if(fs.existsSync(full)&&fs.statSync(full).isFile()){
      res.writeHead(200,{"Content-Type":mime(full)});
      return fs.createReadStream(full).pipe(res);
    }
    send(res,404,{error:"Not found"});
  }catch(e){
    console.error(e);
    send(res,500,{ok:false,error:"Server error"});
  }
});

server.listen(PORT,()=>console.log(`NalaNeo Backend Tester: http://localhost:${PORT}`));
