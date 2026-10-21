// Função para atualizar os dados de uma esteira específica
function atualizarDadosEsteira(idEsteira, correta, multread, noread, unknown) {
    // 1. Seleciona a div "stats" pelo ID (ex: '21', '22', '11')
    const containerEsteira = document.getElementById(idEsteira);

    // 2. Verifica se a esteira realmente existe na página
    if (containerEsteira) {
        // 3. Atualiza o texto de cada span usando a classe correspondente
        containerEsteira.querySelector('.correta').textContent = correta;
        containerEsteira.querySelector('.multread').textContent = multread;
        containerEsteira.querySelector('.noread').textContent = noread;
        containerEsteira.querySelector('.unknown').textContent = unknown;
    } else {
        console.error(`Esteira com ID ${idEsteira} não encontrada.`);
    }
}
// Plataforma A
atualizarDadosEsteira('21', 157, 3, 1, 0);
atualizarDadosEsteira('22', 150, 3, 1, 0);
atualizarDadosEsteira('23', 150, 3, 1, 0);
atualizarDadosEsteira('24', 150, 3, 1, 0);

// Plataforma B
atualizarDadosEsteira('11', 150, 3, 1, 0);
atualizarDadosEsteira('12', 150, 3, 1, 0);
atualizarDadosEsteira('13', 150, 3, 1, 0);
atualizarDadosEsteira('14', 150, 3, 1, 0);

//script machines-----------------------------------------------------

//script bancadas-----------------------------------------------------
document.addEventListener("DOMContentLoaded", carregarRepresentantes);

async function carregarRepresentantes() {
    const tbody = document.getElementById("tabela-representantes");
    const tfoot = document.getElementById("tabela-total");

    try {
        const resposta = await fetch("meta_ban.json");
        if (!resposta.ok) throw new Error("Erro ao carregar meta_ban.json");
        const dados = await resposta.json();

        if (!dados.length) {
            tbody.innerHTML = `<tr><td colspan="6" class="msg">Nenhum representante encontrado.</td></tr>`;
            return;
        }

        tbody.innerHTML = dados.map((rep, i) => {
            // Garante que a utilização fique entre 0 e 100
            const util = Math.min(100, Math.max(0, Number(rep.utilizacao) || 0));
            const classe = util >= 85 ? "alta" : util >= 60 ? "media" : "baixa";

            return `
                <tr>
                    <td class="idx">${i + 1}</td>
                    <td>${rep.re}</td>
                    <td class="num">${formatar(rep.producao_total)}</td>
                    <td class="num">${formatar(rep.producao_liquida_hora)}</td>
                    <td class="num">${formatar(rep.producao_efetiva_hora)}</td>
                    <td>
                        <div class="barra">
                            <div class="preenchimento ${classe}" style="width:${util}%"></div>
                            <span>${util}%</span>
                        </div>
                    </td>
                </tr>`;
        }).join("");

        // Linha de totais/médias
        const soma = campo => dados.reduce((acc, r) => acc + (Number(r[campo]) || 0), 0);
        const media = campo => soma(campo) / dados.length;

        tfoot.innerHTML = `
            <tr>
                <td colspan="2">Total / Média</td>
                <td class="num">${formatar(soma("producao_total"))}</td>
                <td class="num">${formatar(media("producao_liquida_hora"))}</td>
                <td class="num">${formatar(media("producao_efetiva_hora"))}</td>
                <td class="num">${media("utilizacao").toFixed(1)}%</td>
            </tr>`;
    } catch (erro) {
        console.error(erro);
        tbody.innerHTML = `<tr><td colspan="6" class="msg erro">Não foi possível carregar os dados.</td></tr>`;
    }
}

function formatar(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", { maximumFractionDigits: 1 });
}