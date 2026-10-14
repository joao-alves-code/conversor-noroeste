/**
 * Conversor Noroeste — API Google Sheets (protótipo).
 * Vincule este Apps Script à planilha de participantes: Extensões > Apps Script.
 * Crie/importe uma aba chamada PARTICIPANTES contendo:
 * PARTICIPANTE | CONTA | DESCRICAO | ATUALIZADO_EM
 * Implante como aplicativo da Web (Executar como: você; Acesso: qualquer pessoa apenas em ambiente de teste).
 * AVISO: Um endpoint público permite consulta/alteração por quem conhece a URL.
 * Para produção, proteja com login/controle de acesso no servidor ou hospede o HTML no Apps Script
 * usando google.script.run, autenticando os usuários da organização.
 */
const SHEET_NAME = 'PARTICIPANTES';
const HEADERS = ['PARTICIPANTE', 'CONTA', 'DESCRICAO', 'ATUALIZADO_EM'];

function normalizeName_(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/\s+/g, ' ').trim();
}
function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Vincule este projeto à planilha pelo menu Extensões > Apps Script.');
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  if (!sh.getLastRow()) {
    sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sh.setFrozenRows(1);
    sh.getRange('A1:D1').setBackground('#172131').setFontColor('#ffffff').setFontWeight('bold');
    sh.setColumnWidth(1, 430);
    sh.setColumnWidth(2, 140);
    sh.setColumnWidth(3, 430);
    sh.setColumnWidth(4, 190);
    sh.getRange('B:B').setNumberFormat('@');
  }
  return sh;
}
function output_(obj, callback) {
  const json = JSON.stringify(obj);
  if (callback) {
    if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(callback)) throw new Error('Callback inválido');
    return ContentService.createTextOutput(callback + '(' + json + ');').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}
function doGet(e) {
  const callback = (e && e.parameter && e.parameter.callback) || '';
  try {
    const sh = sheet_();
    const rowCount = sh.getLastRow();
    const data = rowCount > 1 ? sh.getRange(2, 1, rowCount - 1, 4).getDisplayValues() : [];
    const items = data.filter(r => r[0] && /^\d+$/.test(String(r[1]).trim()))
      .map(r => ({name: normalizeName_(r[0]), account: String(r[1]).trim(), description: r[2] || '', updatedAt: r[3] || ''}));
    return output_({ok: true, items, count: items.length}, callback);
  } catch (err) {
    return output_({ok: false, error: String(err.message || err)}, callback);
  }
}
function doPost(e) {
  let lock;
  try {
    const p = (e && e.parameter) || {};
    if (p.action !== 'upsert') throw new Error('Operação inválida');
    const name = normalizeName_(p.name);
    const account = String(p.account || '').trim();
    const description = String(p.description || '').trim();
    if (!name || name.length > 240) throw new Error('Participante inválido');
    if (!/^\d{1,25}$/.test(account)) throw new Error('Conta contábil inválida');
    if (description.length > 500) throw new Error('Descrição muito longa');
    lock = LockService.getScriptLock();
    lock.waitLock(20000);
    const sh = sheet_();
    const count = sh.getLastRow();
    const existing = count > 1 ? sh.getRange(2, 1, count - 1, 1).getDisplayValues() : [];
    const ix = existing.findIndex(r => normalizeName_(r[0]) === name);
    const values = [name, "'" + account, description, new Date()];
    if (ix >= 0) sh.getRange(ix + 2, 1, 1, 4).setValues([values]);
    else sh.appendRow(values);
    return output_({ok: true, operation: ix >= 0 ? 'updated' : 'created', name, account});
  } catch(err) {
    return output_({ok: false, error: String(err.message || err)});
  } finally {
    if (lock) try {lock.releaseLock()} catch (_) {}
  }
}
