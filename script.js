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
atualizarDadosEsteira('21', 150, 3, 1, 0);
atualizarDadosEsteira('22', 150, 3, 1, 0);
atualizarDadosEsteira('23', 150, 3, 1, 0);
atualizarDadosEsteira('24', 150, 3, 1, 0);

// Plataforma B
atualizarDadosEsteira('11', 150, 3, 1, 0);
atualizarDadosEsteira('12', 150, 3, 1, 0);
atualizarDadosEsteira('13', 150, 3, 1, 0);
atualizarDadosEsteira('14', 150, 3, 1, 0);