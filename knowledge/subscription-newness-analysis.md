# Indicador de novidades — análise de 15/09/2026

Pedido: borda azul nos canais com novidade e remoção da borda e da bolinha do menu ao selecionar. Análise inicial da 1.4.0. Na 1.5.0, o espelhamento local foi implementado após autorização do usuário.

## Evidência observada

No YouTube autenticado, a seção de inscrições do menu expôs sete canais. As entradas com novidade tinham `line-end-style="dot"`, um `#newness-dot` e descrição acessível de conteúdo novo. A cor calculada foi `rgb(62, 166, 255)` (`#3ea6ff`). A opção Mostrar mais leva à lista de canais; o DOM do menu não fornece o estado de todas as inscrições.

Esse sinal significa novidade segundo o YouTube. Não foi comprovado que corresponda exclusivamente a vídeos longos não assistidos; não deve ser calculado apenas a partir de datas ou do histórico local.

## Custo e viabilidade

| Abordagem | Rede adicional | Trabalho local | Limite |
|---|---|---|---|
| Espelhar sinal do menu | Nenhuma | Mapa por ID e observação apenas da seção do menu | Só canais cujos sinais o YouTube disponibilizou |
| Ocultar borda e bolinha na aba | Nenhuma | Um estado local por canal selecionado e atualização de duas marcas | Não marca a novidade como lida no servidor; pode reaparecer após reload |
| Consultar cada canal periodicamente | Uma consulta por canal por rodada | Parsing, comparação e cache para todos os canais | Alto custo relativo e sem equivalência garantida com o sinal nativo |
| Confirmar leitura no servidor | Desconhecida; integração ainda não validada | Tratamento de sessão e alterações de protocolo | Não há mecanismo validado neste projeto para reconhecer leitura sem visitar o canal |

Com um índice por identidade, uma leitura completa custa O(N) para N entradas disponíveis. Depois, um observer restrito pode processar só entradas alteradas; clicar demanda atualizar o estado de um canal. Memória cresce com os IDs rastreados, sem copiar vídeos ou baixar imagens adicionais. Estes são custos estruturais, não medições de CPU/RAM: não foi implementado nem executado benchmark do indicador.

Para ilustrar a alternativa a evitar: 120 canais consultados a cada cinco minutos gerariam 1.440 requisições por hora, antes de paginação. Espelhar o menu não exige essas requisições.

## Recomendação

Vale a pena espelhar o indicador nativo, sem polling por canal. A borda deve distinguir novidade da seleção (a seleção já usa azul). Sinais ausentes devem ser tratados como desconhecidos, não como ausência de novidades.

O escopo de ocultar também a bolinha precisa ser explicitamente local à aba, com limpeza e expiração do reconhecimento local para não esconder futuras novidades. A atualização integral da página implementada na seleção da 1.4.0 exigiria um pequeno handoff desse reconhecimento também, se aprovado. Não implementar sincronização permanente com a conta antes de validar o mecanismo nativo; custo de manutenção e inconsistência são os principais riscos, mais que consumo de CPU.

## Verificação desta entrega

Os três primeiros ajustes não alteram novidades. Atualização de vídeos usa reload real do documento, mais caro e visualmente mais perceptível que um filtro local, porque o clique nativo na mesma rota manteve os dados anteriores. O handoff da seleção foi verificado no Chromium local, com catálogo sintético e serviços reais, inclusive descarte do documento, restauração do filtro, spinner na paginação e retorno a Todos em reload manual. A extensão instalada não foi validada ponta a ponta nesta sessão.

## Implementação 1.5.0

A borda espelha somente sinais do DOM do menu. Reconhecimento local dura até uma transição nativa de sem novidade para novidade, troca de conta, desativação, reload ou expiração de 30 minutos (avaliada na próxima atualização). Seleção usa fundo preenchido para se distinguir da borda azul. A lista de vídeos é atualizada sem reload; o handoff da 1.4.0 foi removido. Não há consultas por canal nem escrita de leitura no servidor. O endpoint guide é consultado junto do catálogo para a ordem, inclusive com o menu fechado.

## Refatoração 1.6.0

O reconhecimento de novidades permanece separado do índice de vídeos. O feed é atualizado na primeira seleção explícita após a montagem; depois, trocas entre canais reutilizam um mapa efêmero de canal para cards. Paginação acrescenta somente os novos cards ao mapa. Acknowledgements continuam locais, não são persistidos e não provocam consultas por canal.

## Correção 1.6.1

O índice passa a incorporar colaboradores expostos pelos modelos modernos de metadados de autoria do card. Quando esse modelo chega depois da primeira indexação, a assinatura do autor invalida somente aquele card e o associa a todos os canais participantes, preservando o mapa usado nas trocas de filtro.

## Correção 1.6.2

Foi constatado no vídeo reportado que o card moderno não expõe `.data`: os participantes aparecem em um `yt-avatar-stack-view-model`. O filtro agora compara localmente esses avatares com o catálogo completo já carregado e acrescenta apenas correspondências únicas ao índice. Não abre o diálogo, não infere identidade por nome e não faz requisições por vídeo.
