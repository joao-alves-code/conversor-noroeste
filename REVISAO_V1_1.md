# Noroeste – revisão v1.1 (15/10/2026)

## Modificações implementadas
- Separação de **avisos informativos** (`warnings`) e **falhas de extração** (`parseErrors`): a mensagem normal de diagnóstico do leitor XLS não bloqueia a exportação; registros rejeitados e problemas de leitura continuam bloqueando a saída.
- Registros XLS incompletos passam a ter erro explícito, com amostras de linhas para conferência.
- Corrigida a construção dos lançamentos de filial 7 para não gerar três linhas principais por duplicata. Agora são duas linhas interfiliais (filiais 7 e 3); **a natureza exata das contas deve ser homologada** com o arquivo TXT original do VBA.
- Atualizadas as mensagens da interface, com avisos claros sobre a necessidade de homologação do fluxo VBA.
- Preservados integração Netlify, Google Sheets e processamento local de PDF/XLS/XLSX.

## Pendências que NÃO podem ser resolvidas por presunção
- O banco **1** aparece nos exemplos, mas não existe sua correspondência contábil confirmada na tabela original do projeto. A exportação continua bloqueada quando o código não existe no mapeamento (não atribuir conta arbitrária).
- Falta um TXT exportado diretamente pelo VBA e os módulos .bas da rotina RECEBIDAS, necessários para confirmar sem ambiguidades conta 100145, históricos, ajustes de juros e despesas.
- Não há garantia de que a extração de nomes de PDFs com quebra de linha funcione em todos os casos. Confira contagem de duplicatas e total do relatório contra a prévia do app.
- **Não usar como conversor de produção contábil antes de homologação por amostragem e totais.**

## Publicação
O diretório raiz do repositório é o projeto do Netlify. É necessário publicar o repositório atualizado, mantendo as variáveis de ambiente. Para sincronização em lotes, usar o script `setup/GoogleAppsScript_Noroeste.gs` e atualizar a implantação do Apps Script.
