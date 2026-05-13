// Inicialização compartilhada do Firebase Admin SDK para scripts CLI.
//
// Pré-requisitos:
//   1. firebase-admin instalado:
//        cd app && npm install firebase-admin --save-dev
//      (Se já estiver em app/functions/node_modules, este módulo cai pra lá.)
//
//   2. Service account key em `app/sa-key.json` (ou via env
//      GOOGLE_APPLICATION_CREDENTIALS).
//      Pra baixar:
//        Firebase Console → Configurações do Projeto → Contas de serviço →
//        "Gerar nova chave privada" → salvar JSON em app/sa-key.json
//      Já está no .gitignore (linha **/sa-key.json) — nunca vai pro git.

const path = require('path');
const fs = require('fs');

let admin;
try {
  admin = require('firebase-admin');
} catch {
  try {
    admin = require(path.join(__dirname, '..', '..', 'functions', 'node_modules', 'firebase-admin'));
  } catch {
    console.error('Erro: firebase-admin não está instalado.');
    console.error('Rode: cd app && npm install firebase-admin --save-dev');
    process.exit(1);
  }
}

const SA_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS
  || path.join(__dirname, '..', '..', 'sa-key.json');

if (!fs.existsSync(SA_PATH)) {
  console.error(`Service account key não encontrada em:`);
  console.error(`  ${SA_PATH}`);
  console.error('');
  console.error('Pra obter:');
  console.error('  1. https://console.firebase.google.com/project/cnbmobile-2053c/settings/serviceaccounts/adminsdk');
  console.error('  2. "Gerar nova chave privada" → baixa o JSON');
  console.error('  3. Renomeia para sa-key.json e move para app/');
  console.error('');
  console.error('Esse arquivo NÃO vai pro git (já está no .gitignore).');
  process.exit(1);
}

const sa = JSON.parse(fs.readFileSync(SA_PATH, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(sa),
    projectId: sa.project_id,
  });
}

module.exports = {
  admin,
  db: admin.firestore(),
};
