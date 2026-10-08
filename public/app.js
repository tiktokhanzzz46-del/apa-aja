const $=s=>document.querySelector(s);
const $$=s=>document.querySelectorAll(s);

const state={password:"",endpoint:"",loggedIn:false};

function log(message){
  const box=$("#log");
  const now=new Date().toLocaleTimeString("id-ID");
  if(box.textContent==="Belum ada pengujian.") box.textContent="";
  box.textContent += `[${now}] ${message}\n`;
  box.scrollTop=box.scrollHeight;
}

function setOverall(type,text){
  const el=$("#overallStatus");
  el.className=`status ${type}`;
  el.textContent=text;
}

function setService(name,type,text){
  const card=document.querySelector(`.service[data-service="${name}"]`);
  if(!card)return;
  const el=card.querySelector(".service-status");
  el.className=`service-status ${type}`;
  el.innerHTML=`<span></span><b>${text}</b>`;
}

async function apiFetch(path,options={}){
  const base=state.endpoint.replace(/\/+$/,"");
  const url=path.startsWith("http")?path:`${base}${path.startsWith("/")?path:"/"+path}`;
  return fetch(url,{
    ...options,
    headers:{"Content-Type":"application/json",...(options.headers||{})}
  });
}

async function testHealth(){
  state.endpoint=$("#endpoint").value.trim().replace(/\/+$/,"");
  if(!state.endpoint){
    $("#endpointMsg").textContent="Endpoint belum diisi.";
    $("#endpointMsg").className="message error";
    return false;
  }
  setOverall("testing","Menguji...");
  $("#endpointMsg").textContent="Mengirim request ke backend...";
  $("#endpointMsg").className="message";
  log(`TEST API → ${state.endpoint}`);

  const started=performance.now();
  try{
    const r=await apiFetch("/health",{method:"GET"});
    const ms=Math.round(performance.now()-started);
    const body=await r.text();
    if(!r.ok)throw new Error(`HTTP ${r.status}: ${body.slice(0,180)}`);
    setOverall("online","API Online");
    $("#endpointMsg").textContent=`Backend merespons (${r.status}) dalam ${ms} ms.`;
    $("#endpointMsg").className="message ok";
    log(`OK ← HTTP ${r.status} • ${ms} ms • ${body.slice(0,180)}`);
    return true;
  }catch(e){
    setOverall("offline","API Offline");
    $("#endpointMsg").textContent=`Gagal terhubung: ${e.message}`;
    $("#endpointMsg").className="message error";
    log(`GAGAL ← ${e.message}`);
    return false;
  }
}

async function testService(name){
  setService(name,"testing","Menguji...");
  log(`TEST SERVICE → ${name}`);
  try{
    const r=await apiFetch(`/test/${name}`,{
      method:"POST",
      body:JSON.stringify({service:name})
    });
    const body=await r.text();
    if(!r.ok)throw new Error(`HTTP ${r.status}: ${body.slice(0,180)}`);
    setService(name,"online","Backend siap");
    log(`OK ${name} ← HTTP ${r.status} • ${body.slice(0,180)}`);
  }catch(e){
    setService(name,"offline","Belum aktif");
    log(`GAGAL ${name} ← ${e.message}`);
  }
}

$("#loginBtn").addEventListener("click",async()=>{
  const password=$("#password").value;
  if(!password)return;
  const r=await fetch("/admin/login",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({password})
  });
  const data=await r.json().catch(()=>({}));
  if(!r.ok||!data.ok){
    $("#loginMsg").textContent="Password salah.";
    $("#loginMsg").className="message error";
    return;
  }
  state.loggedIn=true;
  state.password="";
  $("#loginView").classList.add("hidden");
  $("#panelView").classList.remove("hidden");
  $("#password").value="";
  log("Admin berhasil masuk.");
});

$("#password").addEventListener("keydown",e=>{
  if(e.key==="Enter")$("#loginBtn").click();
});

$("#logoutBtn").addEventListener("click",async()=>{
  await fetch("/admin/logout",{method:"POST"});
  state.loggedIn=false;
  $("#panelView").classList.add("hidden");
  $("#loginView").classList.remove("hidden");
});

$("#testBtn").addEventListener("click",testHealth);
$("#clearLog").addEventListener("click",()=>$("#log").textContent="Belum ada pengujian.");
$$(".test-service").forEach(btn=>{
  btn.addEventListener("click",()=>testService(btn.dataset.service));
});
