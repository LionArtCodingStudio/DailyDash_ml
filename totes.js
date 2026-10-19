// ===== CONFIGURAÇÕES =====
const STORAGE_TOTES   = 'sp04_totes';
const STORAGE_USUARIO = 'sp04_usuario';
const STORAGE_LOCAL   = 'sp04_ultimo_local';
const REGEX_TOTE      = /^[A-Z0-9-]{4,20}$/; // ajuste ao padrão das suas etiquetas

const LOCAIS = [
    { grupo: 'Plataforma A', itens: ['Esteira 21', 'Esteira 22', 'Esteira 23', 'Esteira 24'] },
    { grupo: 'Plataforma B', itens: ['Esteira 11', 'Esteira 12', 'Esteira 13', 'Esteira 14'] },
    { grupo: 'Outros',       itens: ['Rejeito', 'Buffer', 'Doca'] }
];

// Usado se o sla.json não carregar
const SLA_PADRAO = { cutoffs: ['06:00', '10:00', '14:00', '18:00', '22:00'], alertaMinutos: 30, porLocal: {} };

let configSla    = SLA_PADRAO;
let totes        = JSON.parse(localStorage.getItem(STORAGE_TOTES) || '[]');
let usuarioAtivo = localStorage.getItem(STORAGE_USUARIO) || '';

const $ = (id) => document.getElementById(id);

// ===== SLA =====
async function carregarSla() {
    try {
        const resp = await fetch('sla.json', { cache: 'no-store' });
        if (!resp.ok) throw new Error(resp.status);
        configSla = { ...SLA_PADRAO, ...(await resp.json()) };
    } catch (erro) {
        console.warn('sla.json não carregado, usando SLA padrão.', erro);
    }
}

function calcularSla(dataCadastro, local) {
    const cutoffs = [...(configSla.porLocal?.[local] || configSla.cutoffs)].sort();

    for (const hhmm of cutoffs) {
        const [h, m] = hhmm.split(':').map(Number);
        const d = new Date(dataCadastro);
        d.setHours(h, m, 0, 0);
        if (d > dataCadastro) return d;
    }
    // Passou do último corte do dia -> primeiro corte do dia seguinte
    const [h, m] = cutoffs[0].split(':').map(Number);
    const d = new Date(dataCadastro);
    d.setDate(d.getDate() + 1);
    d.setHours(h, m, 0, 0);
    return d;
}

function statusSla(slaIso) {
    const minutos = (new Date(slaIso) - Date.now()) / 60000;
    if (minutos < 0) return { classe: 'atrasado', texto: 'Atrasado' };
    if (minutos <= configSla.alertaMinutos) return { classe: 'alerta', texto: 'Atenção' };
    return { classe: 'ok', texto: 'No prazo' };
}

function formatarRestante(slaIso) {
    let diff = Math.round((new Date(slaIso) - Date.now()) / 60000);
    const sinal = diff < 0 ? '-' : '';
    diff = Math.abs(diff);
    return `${sinal}${Math.floor(diff / 60)}h ${String(diff % 60).padStart(2, '0')}min`;
}

const formatarData = (iso) =>
    new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

// ===== UTILITÁRIOS =====
function escapeHtml(txt) {
    return String(txt).replace(/[&<>"']/g, (c) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function beep(ok = true) {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        osc.frequency.value = ok ? 880 : 220;
        osc.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + (ok ? 0.1 : 0.4));
    } catch (_) { /* sem áudio */ }
}

function mostrarMensagem(texto, tipo) {
    const el = $('mensagem');
    el.textContent = texto;
    el.className = `mensagem ${tipo}`;
    beep(tipo === 'sucesso');
}

function limparScan() {
    $('numeroTote').value = '';
    $('numeroTote').focus();
}

function salvar() {
    localStorage.setItem(STORAGE_TOTES, JSON.stringify(totes));
}

// ===== LOCAIS =====
function popularLocais() {
    const grupos = LOCAIS.map((g) =>
        `<optgroup label="${g.grupo}">${g.itens.map((i) => `<option value="${i}">${i}</option>`).join('')}</optgroup>`
    ).join('');

    $('localTote').innerHTML   = `<option value="">Selecione...</option>${grupos}`;
    $('filtroLocal').innerHTML = `<option value="">Todos os locais</option>${grupos}`;
    $('localTote').value = localStorage.getItem(STORAGE_LOCAL) || '';
}

// ===== USUÁRIO =====
function atualizarUsuario() {
    $('usuarioNome').textContent = usuarioAtivo || '—';
}

function abrirModalUsuario() {
    $('modalUsuario').classList.remove('oculto');
    $('inputUsuario').value = '';
    $('inputUsuario').focus();
}

function salvarUsuario() {
    const nome = $('inputUsuario').value.trim();
    if (!nome) return;
    usuarioAtivo = nome;
    localStorage.setItem(STORAGE_USUARIO, nome);
    atualizarUsuario();
    $('modalUsuario').classList.add('oculto');
    limparScan();
}

// ===== CADASTRO =====
function cadastrarTote(e) {
    e.preventDefault();
    const numero = $('numeroTote').value.trim().toUpperCase();
    const local  = $('localTote').value;

    if (!usuarioAtivo) return abrirModalUsuario();
    if (!numero) return;
    if (!local) {
        mostrarMensagem('Selecione o local da tote antes de escanear.', 'erro');
        return limparScan();
    }
    if (!REGEX_TOTE.test(numero)) {
        mostrarMensagem(`Código inválido: ${numero}`, 'erro');
        return limparScan();
    }
    if (totes.some((t) => t.numero === numero)) {
        mostrarMensagem(`Tote ${numero} já está cadastrada.`, 'erro');
        return limparScan();
    }

    const agora = new Date();
    totes.unshift({
        numero,
        local,
        usuario: usuarioAtivo,
        cadastro: agora.toISOString(),
        sla: calcularSla(agora, local).toISOString()
    });

    salvar();
    renderizar();
    mostrarMensagem(`Tote ${numero} cadastrada em ${local}.`, 'sucesso');
    limparScan();
}

function removerTote(numero) {
    if (!confirm(`Remover a tote ${numero}?`)) return;
    totes = totes.filter((t) => t.numero !== numero);
    salvar();
    renderizar();
    limparScan();
}

// ===== RENDERIZAÇÃO =====
function renderizar() {
    const busca  = $('filtroBusca').value.trim().toUpperCase();
    const filtro = $('filtroLocal').value;

    const lista = totes.filter((t) =>
        (!busca || t.numero.includes(busca)) && (!filtro || t.local === filtro));

    $('totalTotes').textContent = lista.length;

    if (!lista.length) {
        $('listaTotes').innerHTML = `<tr><td colspan="8" class="vazio">Nenhuma tote cadastrada.</td></tr>`;
        return;
    }

    $('listaTotes').innerHTML = lista.map((t) => {
        const st = statusSla(t.sla);
        return `
            <tr class="linha-${st.classe}">
                <td class="tote-numero">${escapeHtml(t.numero)}</td>
                <td>${escapeHtml(t.local)}</td>
                <td>${escapeHtml(t.usuario)}</td>
                <td>${formatarData(t.cadastro)}</td>
                <td>${formatarData(t.sla)}</td>
                <td>${formatarRestante(t.sla)}</td>
                <td><span class="badge ${st.classe}">${st.texto}</span></td>
                <td><button class="btn-remover" data-numero="${escapeHtml(t.numero)}" title="Remover">✕</button></td>
            </tr>`;
    }).join('');
}

// ===== INICIALIZAÇÃO =====
async function init() {
    popularLocais();
    await carregarSla();
    atualizarUsuario();
    renderizar();
    if (!usuarioAtivo) abrirModalUsuario();

    $('formTote').addEventListener('submit', cadastrarTote);
    $('localTote').addEventListener('change', (e) => {
        localStorage.setItem(STORAGE_LOCAL, e.target.value);
        limparScan();
    });

    $('btnTrocarUsuario').addEventListener('click', abrirModalUsuario);
    $('btnSalvarUsuario').addEventListener('click', salvarUsuario);
    $('inputUsuario').addEventListener('keydown', (e) => { if (e.key === 'Enter') salvarUsuario(); });

    $('filtroBusca').addEventListener('input', renderizar);
    $('filtroLocal').addEventListener('change', renderizar);

    $('btnLimpar').addEventListener('click', () => {
        if (!confirm('Apagar TODAS as totes cadastradas?')) return;
        totes = [];
        salvar();
        renderizar();
    });

    $('listaTotes').addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-remover');
        if (btn) removerTote(btn.dataset.numero);
    });

    // Volta o foco para o campo do scanner ao clicar em área vazia
    document.addEventListener('click', (e) => {
        const modalAberto = !$('modalUsuario').classList.contains('oculto');
        if (!modalAberto && !e.target.closest('input, select, button')) $('numeroTote').focus();
    });

    // Atualiza o tempo restante e o status a cada 30 s
    setInterval(renderizar, 30000);
}

init();