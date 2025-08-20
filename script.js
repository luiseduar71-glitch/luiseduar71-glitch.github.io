let baseDatos = [];
let listaSKUs = [];

// Toast helper
function toast(msg, type="info"){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  if(type==="ok"){t.style.borderColor = "rgba(34,197,94,.6)";}
  else if(type==="warn"){t.style.borderColor="rgba(253,224,71,.6)";}
  else if(type==="err"){t.style.borderColor="rgba(239,68,68,.6)";}
  setTimeout(()=>t.classList.remove('show'), 2000);
}

async function cargarBD() {
  try{
    const res = await fetch('bd.json', {cache: "no-store"});
    baseDatos = await res.json();
  }catch(e){
    toast("No pude leer bd.json", "err");
  }
}

async function buscarSKU(){
  const sku = parseInt(document.getElementById('skuInput').value);
  if(!baseDatos.length) await cargarBD();
  const p = baseDatos.find(it => it.SKU === sku);
  if(p){
    document.getElementById('nombreInput').value = p.NOMBRE ?? "";
    document.getElementById('uxcInput').value = p.UxC ?? "";
    document.getElementById('pesoInput').value = p.Peso ?? "";
    toast("SKU cargado ✔", "ok");
  }else{
    toast("SKU no encontrado", "warn");
  }
}

function setMeta(){ actualizarCarga(); }

function agregarSKU(){
  const sku = parseInt(document.getElementById('skuInput').value);
  const nombre = document.getElementById('nombreInput').value;
  const uxc = parseFloat(document.getElementById('uxcInput').value);
  const peso = parseFloat(document.getElementById('pesoInput').value);
  const unidad = document.getElementById('unidadSelect').value;
  const cantidad = parseFloat(document.getElementById('cantidadInput').value);

  if(!sku || !nombre || isNaN(uxc) || isNaN(peso) || isNaN(cantidad)){
    toast("Completa los campos", "warn");
    return;
  }

  const unidadesTotales = unidad === 'CTN' ? cantidad * uxc : cantidad;
  const pesoTotalKg = unidadesTotales * peso;
  const pesoTotalT = pesoTotalKg / 1000;

  listaSKUs.push({ sku, nombre, cantidad, unidad, pesoTotalT });
  actualizarTabla();
  actualizarCarga();
  toast("SKU agregado", "ok");
}

function eliminarSKU(i){
  listaSKUs.splice(i,1);
  actualizarTabla();
  actualizarCarga();
}

function actualizarTabla(){
  const tbody = document.querySelector('#tablaSKUs tbody');
  tbody.innerHTML = "";
  listaSKUs.forEach((item, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${i+1}</td>
      <td>${item.sku}</td>
      <td>${item.nombre}</td>
      <td>${item.cantidad}</td>
      <td>${item.unidad}</td>
      <td>${item.pesoTotalT.toFixed(3)}</td>
      <td><button class="btn-delete" onclick="eliminarSKU(${i})">Eliminar</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function actualizarCarga(){
  const meta = parseFloat(document.getElementById('metaSelect').value);
  const total = listaSKUs.reduce((sum, it)=> sum + it.pesoTotalT, 0);
  document.getElementById('totalToneladas').textContent = total.toFixed(3);

  // porcentaje (0-100)
  const pct = Math.max(0, Math.min((total / meta) * 100, 100));

  const cont = document.getElementById('truckCont');
  const barra = document.getElementById('camionRelleno');
  const truck = document.getElementById('camionIcono');
  const shadow = document.querySelector('.truck__shadow');

  const contW = cont.clientWidth;
  const truckW = truck.offsetWidth || 34;

  const fillPx = (pct/100) * contW;
  const truckLeft = Math.max(0, fillPx - truckW * 0.85);

  // Set widths/positions
  barra.style.width = fillPx + 'px';
  truck.style.left = truckLeft + 'px';
  shadow.style.left = truckLeft + 'px';
  shadow.style.width = (truckW*1.1) + 'px';

  // color states
  if(pct >= 100){
    barra.style.background = "linear-gradient(90deg, #ef4444, #b91c1c)";
  }else if(pct >= 90){
    barra.style.background = "linear-gradient(90deg, #fde047, #f59e0b)";
  }else{
    barra.style.background = "linear-gradient(90deg, #22c55e, #84cc16)";
  }
}

cargarBD();



// === V2: dynamic truck size by capacity ===
function scaleTruckByCapacity(){
  const select = document.getElementById('metaSelect');
  const cont   = document.getElementById('truckCont');
  const truck  = document.getElementById('camionIcono');
  const val = String(select.value);
  // Map capacity to container height class & emoji font-size factor
  const map = {
    "1.5": {cls: "truck--small",  factor: 0.70},
    "3":   {cls: "truck--med",    factor: 0.78},
    "5":   {cls: "truck--large",  factor: 0.86},
    "8":   {cls: "truck--xlarge", factor: 0.96}
  };
  // Reset classes
  cont.classList.remove("truck--small","truck--med","truck--large","truck--xlarge");
  const cfg = map[val] || map["5"];
  cont.classList.add(cfg.cls);
  // Sync emoji size with track height
  const h = cont.clientHeight;
  const fontPx = Math.max(26, Math.floor(h * cfg.factor));
  truck.style.fontSize = fontPx + "px";
}
// Hook change
document.addEventListener("DOMContentLoaded", ()=>{
  const sel = document.getElementById('metaSelect');
  sel.addEventListener('change', ()=>{ scaleTruckByCapacity(); actualizarCarga(); });
  // initial sizing once layout is ready
  setTimeout(scaleTruckByCapacity, 50);
});
