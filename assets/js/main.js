// ============================================================================
// main.js — Ponto de entrada da aplicação
// Responsabilidade: importar e inicializar cada módulo, na ordem correta.
// É o único arquivo JS referenciado pelo HTML.
// ============================================================================

import { initNav } from './nav.js';
import { initFeedback } from './feedback.js';
import { initForm } from './forms.js';

// Como este arquivo é carregado com type="module" no HTML, o navegador
// o executa automaticamente após o parsing do DOM (comportamento defer
// nativo de módulos). Por isso não precisamos envolver as chamadas em
// 'DOMContentLoaded' — quando este código roda, todo o HTML já está pronto.

initNav();       // cabeçalho, menu mobile, dropdown
initFeedback();  // toasts, modal, alerts
initForm();      // máscaras, CPF, ViaCEP, localStorage, submit