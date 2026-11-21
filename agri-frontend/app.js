// GreenFarm frontend - compatible with contracts/AgriculturalTraceability.sol
// Paste the deployed contract address in CONTRACT_ADDRESS below before use.
const CONTRACT_ADDRESS = "0x0489121AfeB9DD3aF2D6DD1904D2E45b7B2CDAd9";
const ABI = [
  "function admin() view returns (address)",
  "function nextBatchId() view returns (uint256)",
  "function stakeholders(address) view returns (string name, uint8 role, bool active)",
  "function registerStakeholder(address account,string name,uint8 role)",
  "function setStakeholderActive(address account,bool active)",
  "function registerProductBatch(string productName,string origin,string harvestDate) returns (uint256)",
  "function transferCustody(uint256 batchId,address newOwner,string details)",
  "function updateProductStatus(uint256 batchId,uint8 newStatus,string details)",
  "function recallProduct(uint256 batchId,string reason)",
  "function getProduct(uint256 batchId) view returns (tuple(uint256 batchId,string productName,string origin,string harvestDate,address farmer,address currentOwner,uint8 status,bool recalled,bool exists))",
  "function getProductHistory(uint256 batchId) view returns (tuple(uint256 timestamp,address actor,string action,string details)[])",
  "function getHistoryCount(uint256 batchId) view returns (uint256)"
];
const ROLE_NAMES = ["None","Farmer","Transporter","Distributor","Retailer","Inspector"];
const STATUS_NAMES = ["Registered","Harvested","InTransit","AtWarehouse","AtRetailer","Recalled"];
const STATUS_TH = ["ลงทะเบียนแล้ว","เก็บเกี่ยวแล้ว","อยู่ระหว่างขนส่ง","ถึงคลังสินค้า","ถึงร้านค้า","เรียกคืนแล้ว"];
let provider, signer, contract, walletAddress = "", isAdmin = false, cachedProducts = [];
const $ = (s) => document.querySelector(s);
const short = (a) => a ? `${a.slice(0,6)}...${a.slice(-4)}` : "—";
function toast(message, error=false){const el=$("#toast");el.textContent=message;el.className=`toast show${error?' error':''}`;clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.className='toast',4200)}
function statusBadge(status){const cls=Number(status)===5?'red':Number(status)===2?'blue':'';return `<span class="badge ${cls}">${STATUS_TH[Number(status)]||'ไม่ทราบสถานะ'}</span>`}
function requireContract(write=false){if(!contract)throw new Error('กรุณาเชื่อมต่อ MetaMask และตั้งค่าที่อยู่ Smart Contract ก่อน');if(write&&!signer)throw new Error('กรุณาเชื่อมต่อกระเป๋า MetaMask');return contract}
function explainError(e){let m=e?.shortMessage||e?.reason||e?.info?.error?.message||e?.message||'เกิดข้อผิดพลาด';if(m.includes('user rejected'))m='คุณปฏิเสธการทำรายการใน MetaMask';else if(m.includes('Admin only'))m='ฟังก์ชันนี้อนุญาตเฉพาะ Admin';else if(m.includes('Farmer only'))m='ต้องใช้บัญชีที่ลงทะเบียนเป็น Farmer';else if(m.includes('Not an active stakeholder'))m='บัญชีนี้ยังไม่ได้ลงทะเบียนหรือถูกปิดใช้งาน';else if(m.includes('Not the current owner')||m.includes('Current owner only'))m='เฉพาะเจ้าของสินค้าปัจจุบันเท่านั้นที่ทำรายการนี้ได้';else if(m.includes('Batch does not exist'))m='ไม่พบ Batch ID นี้';return m}
async function connectWallet(){try{if(!window.ethereum)throw new Error('ไม่พบ MetaMask กรุณาติดตั้ง Extension MetaMask');provider=new ethers.BrowserProvider(window.ethereum);await provider.send('eth_requestAccounts',[]);signer=await provider.getSigner();walletAddress=await signer.getAddress();const net=await provider.getNetwork();if(net.chainId!==11155111n){try{await window.ethereum.request({method:'wallet_switchEthereumChain',params:[{chainId:'0xaa36a7'}]})}catch(e){if(e.code===4902)await window.ethereum.request({method:'wallet_addEthereumChain',params:[{chainId:'0xaa36a7',chainName:'Sepolia',nativeCurrency:{name:'Sepolia ETH',symbol:'ETH',decimals:18},rpcUrls:['https://rpc.sepolia.org'],blockExplorerUrls:['https://sepolia.etherscan.io']}]});else throw e}provider=new ethers.BrowserProvider(window.ethereum);signer=await provider.getSigner();walletAddress=await signer.getAddress()}
if(!ethers.isAddress(CONTRACT_ADDRESS))throw new Error('กรุณาใส่ Contract Address ที่ Deploy แล้วในไฟล์ app.js บรรทัด CONTRACT_ADDRESS');contract=new ethers.Contract(CONTRACT_ADDRESS,ABI,signer);isAdmin=(await contract.admin()).toLowerCase()===walletAddress.toLowerCase();$('#connectBtn').textContent=short(walletAddress);$('#connectBtn').classList.add('connected');toast(`เชื่อมต่อสำเร็จ ${short(walletAddress)}${isAdmin?' · Admin':''}`);await loadDashboard();}catch(e){toast(explainError(e),true)}}
async function loadDashboard(){if(!contract)return;try{const next=Number(await contract.nextBatchId());cachedProducts=[];for(let id=1;id<next;id++){try{const p=await contract.getProduct(id);if(p.exists)cachedProducts.push(p)}catch(_){}}let active=0; // stakeholders are mapping-based; no enumerable list is exposed by this contract.
$('#statBatches').textContent=cachedProducts.length;$('#statPeople').textContent='—';$('#statTransit').textContent=cachedProducts.filter(p=>Number(p.status)===2).length;$('#statRecall').textContent=cachedProducts.filter(p=>p.recalled).length;renderProducts();renderRecent();}catch(e){toast(explainError(e),true)}}
function renderRecent(){const rows=cachedProducts.slice(-5).reverse();$('#recentRows').innerHTML=rows.length?rows.map(p=>`<tr><td>#${p.batchId}</td><td><b>${esc(p.productName)}</b></td><td>${esc(p.origin)}</td><td>${esc(p.harvestDate||'—')}</td><td>${statusBadge(p.status)}</td><td><button class="text-button" data-lookup="${p.batchId}">ดูข้อมูล →</button></td></tr>`).join(''):'<tr><td colspan="6" class="empty">ยังไม่มี Product Batch</td></tr>'}
function renderProducts(){const q=($('#productSearch')?.value||'').toLowerCase();const rows=cachedProducts.filter(p=>String(p.batchId).includes(q)||p.productName.toLowerCase().includes(q)).slice().reverse();$('#productRows').innerHTML=rows.length?rows.map(p=>`<tr><td>#${p.batchId}</td><td><b>${esc(p.productName)}</b></td><td>${esc(p.origin)}</td><td>${short(p.farmer)}</td><td>${short(p.currentOwner)}</td><td>${statusBadge(p.status)}</td><td><button class="text-button" data-lookup="${p.batchId}">ตรวจสอบ</button></td></tr>`).join(''):'<tr><td colspan="7" class="empty">ไม่พบข้อมูลสินค้า</td></tr>'}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
async function sendTx(fn,...args){const c=requireContract(true);toast('กำลังส่งธุรกรรม กรุณายืนยันใน MetaMask');const tx=await c[fn](...args);toast('ส่งธุรกรรมแล้ว กำลังรอยืนยันบน Blockchain...');await tx.wait();toast('ทำรายการสำเร็จ บันทึกลง Blockchain แล้ว');await loadDashboard()}

$('#connectBtn').addEventListener('click', connectWallet);
$('#refreshBtn').addEventListener('click', loadDashboard);
$('#productSearch').addEventListener('input', renderProducts);

// Register Stakeholder
$('#stakeholderForm').addEventListener('submit', async e => {
    e.preventDefault();
    const form = e.currentTarget;

    try {
        const f = new FormData(form);

        await sendTx(
            'registerStakeholder',
            f.get('account'),
            f.get('name'),
            Number(f.get('role'))
        );

        form.reset();
    } catch (err) {
        toast(explainError(err), true);
    }
});

// Register Product Batch
$('#batchForm').addEventListener('submit', async e => {
    e.preventDefault();
    const form = e.currentTarget;

    try {
        const f = new FormData(form);

        await sendTx(
            'registerProductBatch',
            f.get('productName'),
            f.get('origin'),
            f.get('harvestDate')
        );

        form.reset();
    } catch (err) {
        toast(explainError(err), true);
    }
});

// Transfer Custody
$('#transferForm').addEventListener('submit', async e => {
    e.preventDefault();
    const form = e.currentTarget;

    try {
        const f = new FormData(form);

        if (!ethers.isAddress(f.get('newOwner'))) {
            throw new Error('Wallet Address ผู้รับไม่ถูกต้อง');
        }

        await sendTx(
            'transferCustody',
            BigInt(f.get('batchId')),
            f.get('newOwner'),
            f.get('details')
        );

        form.reset();

    } catch (err) {
        toast(explainError(err), true);
    }
});

// Update Product Status
$('#statusForm').addEventListener('submit', async e => {
    e.preventDefault();
    const form = e.currentTarget;

    try {
        const f = new FormData(form);

        await sendTx(
            'updateProductStatus',
            BigInt(f.get('batchId')),
            Number(f.get('status')),
            f.get('details')
        );

        form.reset();

    } catch (err) {
        toast(explainError(err), true);
    }
});

// Recall Product
$('#recallForm').addEventListener('submit', async e => {
    e.preventDefault();
    const form = e.currentTarget;

    const f = new FormData(form);

    if (!confirm('ยืนยันเรียกคืนสินค้าล็อตนี้? การดำเนินการไม่สามารถย้อนกลับได้')) {
        return;
    }

    try {
        await sendTx(
            'recallProduct',
            BigInt(f.get('batchId')),
            f.get('reason')
        );

        form.reset();

    } catch (err) {
        toast(explainError(err), true);
    }
});

// Trace Product
$('#traceForm').addEventListener('submit', async e => {
    e.preventDefault();
    const form = e.currentTarget;

    try {
        const f = new FormData(form);
        const id = BigInt(f.get('batchId'));
        const c = requireContract();

        const [p, h] = await Promise.all([
            c.getProduct(id),
            c.getProductHistory(id)
        ]);

        showTrace(p, h);

    } catch (err) {
        $('#traceResult').innerHTML = `
            <div class="empty-state">
                <span>⚠️</span>
                <b>${esc(explainError(err))}</b>
            </div>
        `;
    }
});

$('#mainNav').addEventListener('click',e=>{const b=e.target.closest('[data-page]');if(b)showPage(b.dataset.page)});document.addEventListener('click',e=>{const g=e.target.closest('[data-goto]');if(g)showPage(g.dataset.goto);const l=e.target.closest('[data-lookup]');if(l){showPage('trace');$('#traceForm [name=batchId]').value=l.dataset.lookup;$('#traceForm').requestSubmit()}});
function showPage(name){document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id===`page-${name}`));document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.page===name));const titles={dashboard:'ภาพรวมระบบ',products:'สินค้าเกษตร',stakeholders:'ผู้เกี่ยวข้อง',trace:'ตรวจสอบย้อนกลับ',operations:'จัดการสินค้าและการส่งมอบ',recall:'เรียกคืนสินค้า'};$('#pageTitle').textContent=titles[name]||'GreenFarm';window.scrollTo({top:0,behavior:'smooth'})}
$('#modalClose').addEventListener('click',()=>$('#modal').classList.remove('show'));
if(window.ethereum){window.ethereum.on('accountsChanged',()=>location.reload());window.ethereum.on('chainChanged',()=>location.reload())}
