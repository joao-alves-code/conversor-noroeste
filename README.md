# Noroeste — Conversor Web + Google Sheets

Este projeto contém a interface do conversor de duplicatas recebidas, API Netlify Functions e código da API Google Apps Script.

## Publicação (NÃO usar Netlify Drop)

1. Crie um repositório GitHub e envie o conteúdo desta pasta **na raiz do repositório**: `public/index.html`, `netlify.toml`, pasta `netlify/functions`.
2. Netlify → Add new project → Import an existing project → GitHub → selecione esse repositório.
3. Build command: **deixar em branco**. Publish directory: `public`. Functions directory: `netlify/functions` (já definido no `netlify.toml`).
4. Em Site configuration → Environment variables crie `GOOGLE_APPS_SCRIPT_URL` com a URL publicada **/exec** do Apps Script. Não utilize `/dev` nem URL de edição. Marque como disponível para Functions.
5. Faça o deploy / redeploy.
6. Abra `https://SEU-SITE.netlify.app/.netlify/functions/diagnostico`: deve aparecer `functionDeployed:true`, `googleAppsScriptConfigured:true`.
7. Abra `https://SEU-SITE.netlify.app/api/participantes` para testar a leitura do Sheets. `ok:true` + `items` indica integração funcionando.
8. Abra a página inicial e clique Atualizar cadastro. Cadastros novos são enviados através da Function.

## Google Sheets / Apps Script

- A planilha deve ter aba `PARTICIPANTES` com colunas `PARTICIPANTE | CONTA | DESCRICAO | ATUALIZADO_EM`.
- Para preparar a API na planilha, Extensões → Apps Script, cole `setup/GoogleAppsScript_Noroeste.gs`, salve, Implantações → Aplicativo da Web, execute como proprietário da planilha.
- Para a integração de teste com Netlify Function sem autenticação Google, o endpoint Apps Script precisa estar acessível ao backend; **não exponha dados reais em um endpoint público**.
- O HTML não contém nem solicita URL do Apps Script: ela permanece na variável de ambiente Netlify.

## Segurança antes da produção

A Function de teste não autentica colaboradores. Se o domínio Netlify estiver público, qualquer visitante pode consultar ou criar/atualizar cadastros. Para uso real, inclua identidade corporativa (Google OAuth/SSO), autorização por usuário na Function, controles de auditoria e restrições de acesso. Esconder a URL no Netlify não é autenticação.

## Limitação do protótipo

A extração do PDF e as regras de lançamentos ainda precisam ser homologadas contra um TXT original do Excel; o Google Sheets resolve armazenamento compartilhado de contas, não erros na interpretação do PDF ou códigos bancários. Os PDFs são interpretados no navegador.

## Diagnóstico

- `/.netlify/functions/diagnostico` = 404 → projeto publicado sem Functions (geralmente Netlify Drop ou diretório incorreto).
- `/.netlify/functions/diagnostico` = ok:true e variável false → configure environment variable e faça redeploy.
- `/api/participantes` = 502 → Apps Script /exec não acessível ou script com problema; valide a URL e os permissões.
- `/api/participantes` = 200 + ok:true → conexão estabelecida.

## Versão 0.5: PDF e Excel + desempenho
- Entrada: PDF, XLS, XLSX e TXT. XLS e XLSX interpretados no navegador por SheetJS; PDFs via PDF.js. Necessária conexão à internet para bibliotecas CDN.
- Ambos compartilham as mesmas regras de lançamento e cadastro Google Sheets.
- Cache de correspondências e índices de participantes, renderização apenas da aba ativa e busca com debounce.
- XLS legados: confira sempre contagem de duplicatas, valores e bancos contra o original antes de exportar; formatos muito diferentes podem exigir mapeamento adicional.
- Deploy: substitua o conteúdo do repositório GitHub por estes arquivos mantendo environment variables Netlify existentes.


## Verificação obrigatória de deploy v0.6
Após publicar o commit na branch monitorada pelo Netlify, abra a página em janela anônima. Na área de importação deve aparecer `v0.6 · XLS 14/10 · leitor por células`. Se o erro exato `Campos finais não identificados em ...` voltar ao importar XLS, a página ainda é de uma versão anterior (pois o leitor XLS v0.6 não emite essa frase). Verifique a URL da página, a branch e o Deploy log. Uma importação XLS v0.6 pode emitir erros indicando campos faltantes — nesse caso envie 5 linhas do relatório e o novo diagnóstico.


## v0.7
A importação XLS detecta registros pelo código de entidade, lê o campo 3/7 como filial, localiza a duplicata e agrupa linhas de continuação. Os 7 campos numéricos após a terceira data formam valor, juros, despesa, banco, operação, ATS e conta. Antes de contabilizar, confira os totais e registros com o original.


## Correção v0.8
A v0.7 lançava `ReferenceError: valor is not defined` em `excelToRecords` porque a variável declarada era `value`. A v0.8 grava `valor: value` no registro. Nenhuma regra contábil nem Function foi modificada. Ainda requer conferência de quantidade e totais no XLS.


## v0.9 — progresso da sincronização
- Barra de progresso real por cadastro confirmado, botão interromper e retomada segura.
- Consulta prévia elimina gravações de cadastros já idênticos no Google Sheets.
- Fila é atualizada após cada resposta HTTP e preservada se houver erro ou interrupção.
- Consulta final confirma contas gravadas na planilha; divergências voltam para a fila.
- Cada cadastro ainda usa uma chamada ao Apps Script. Não é envio em lote.
- O status de progresso é válido apenas enquanto a aba do navegador permanecer aberta.


## Versão 1.0 — sincronização em lote
- HTML envia lotes de até 50 participantes, em lugar de um POST por cadastro.
- Netlify Function valida e encaminha `batchUpsert`.
- Apps Script faz atualização de lote em uma única escrita de células.
- **OBRIGATÓRIO:** substituir o código Apps Script pelo novo `setup/GoogleAppsScript_Noroeste.gs` e publicar uma **nova versão** da implantação web. Depois publicar o repositório no Netlify.
- Faça primeiro teste com 5 cadastros. A barra avança quando cada lote é confirmado.
- A sincronização não deve ser disponibilizada em API pública sem autenticação.
