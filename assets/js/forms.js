// ============================================================================
// forms.js — Módulo do formulário de cadastro
// Responsabilidade: máscaras, validação de CPF, integração ViaCEP,
// persistência de rascunho em localStorage e envio simulado.
// Depende de: showToast (feedback.js)
// ============================================================================

import { showToast } from './feedback.js';

/* ------------------------------------------------------------------ */
/* Helpers internos do módulo                                          */
/* ------------------------------------------------------------------ */
const onlyDigits = (value) => value.replace(/\D/g, '');

const maskCPF = (value) => {
  let v = onlyDigits(value).slice(0, 11);
  v = v.replace(/(\d{3})(\d)/, '$1.$2');
  v = v.replace(/(\d{3})(\d)/, '$1.$2');
  v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  return v;
};

const maskTelefone = (value) => {
  let v = onlyDigits(value).slice(0, 11);
  if (v.length > 10) {
    v = v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
  } else if (v.length > 5) {
    v = v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
  } else if (v.length > 2) {
    v = v.replace(/(\d{2})(\d{0,5})/, '($1) $2');
  } else if (v.length > 0) {
    v = v.replace(/(\d{0,2})/, '($1');
  }
  return v.trim().replace(/-$/, '').replace(/\)\s*$/, ') ').trimEnd();
};

const maskCEP = (value) => {
  let v = onlyDigits(value).slice(0, 8);
  v = v.replace(/(\d{5})(\d{1,3})$/, '$1-$2');
  return v;
};

/**
 * Aplica máscara a um input preservando a posição do cursor.
 */
const bindMask = (input, maskFn) => {
  if (!input) return;
  input.addEventListener('input', (e) => {
    const cursorFromEnd = e.target.value.length - e.target.selectionStart;
    e.target.value = maskFn(e.target.value);
    const pos = e.target.value.length - cursorFromEnd;
    e.target.setSelectionRange(pos, pos);
  });
};

/**
 * Valida CPF pelos dígitos verificadores (algoritmo módulo 11).
 */
function isValidCPF(raw) {
  const cpf = onlyDigits(raw);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const calcCheckDigit = (base) => {
    let sum = 0;
    let weight = base.length + 1;
    for (const digit of base) {
      sum += parseInt(digit, 10) * weight;
      weight -= 1;
    }
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };

  const digit1 = calcCheckDigit(cpf.slice(0, 9));
  const digit2 = calcCheckDigit(cpf.slice(0, 9) + digit1);

  return cpf === cpf.slice(0, 9) + String(digit1) + String(digit2);
}

/* ------------------------------------------------------------------ */
/* Constantes do módulo                                                */
/* ------------------------------------------------------------------ */
const DRAFT_KEY = 'raizes:cadastro:rascunho';
const draftFields = [
  'nome', 'email', 'nascimento', 'telefone', 'cpf',
  'cep', 'numero', 'rua', 'bairro', 'cidade', 'estado', 'mensagem',
];

/* ------------------------------------------------------------------ */
/* Inicialização do formulário                                         */
/* ------------------------------------------------------------------ */
export function initForm() {
  const form = document.getElementById('form-cadastro');
  if (!form) return;

  const cpfInput = form.querySelector('#cpf');
  const telInput = form.querySelector('#telefone');
  const cepInput = form.querySelector('#cep');

  bindMask(cpfInput, maskCPF);
  bindMask(telInput, maskTelefone);
  bindMask(cepInput, maskCEP);

  /* ---------------------------------------------------------------- */
  /* Utilitário de erro por campo                                      */
  /* ---------------------------------------------------------------- */
  const setFieldError = (input, message) => {
    const field = input.closest('.field');
    if (!field) return;
    const errorEl = field.querySelector('.error-msg');
    if (message) {
      field.classList.add('has-error');
      if (errorEl) errorEl.textContent = message;
      input.setAttribute('aria-invalid', 'true');
    } else {
      field.classList.remove('has-error');
      if (errorEl) errorEl.textContent = '';
      input.removeAttribute('aria-invalid');
    }
  };

  /* ---------------------------------------------------------------- */
  /* Validação de CPF ao sair do campo                                 */
  /* ---------------------------------------------------------------- */
  if (cpfInput) {
    cpfInput.addEventListener('blur', () => {
      if (!cpfInput.value) return;
      if (!isValidCPF(cpfInput.value)) {
        setFieldError(cpfInput, 'CPF inválido. Confira os números digitados.');
        cpfInput.setCustomValidity('CPF inválido');
      } else {
        setFieldError(cpfInput, '');
        cpfInput.setCustomValidity('');
      }
    });
  }

  /* ---------------------------------------------------------------- */
  /* Busca de endereço via ViaCEP ao sair do campo CEP                 */
  /* ---------------------------------------------------------------- */
  const ruaInput = form.querySelector('#rua');
  const bairroInput = form.querySelector('#bairro');
  const cidadeInput = form.querySelector('#cidade');
  const estadoInput = form.querySelector('#estado');
  const cepHint = form.querySelector('#cep-hint');

  if (cepInput) {
    cepInput.addEventListener('blur', async () => {
      const digits = onlyDigits(cepInput.value);
      if (digits.length !== 8) return;
      if (cepHint) cepHint.textContent = 'Buscando endereço…';
      try {
        const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
        const data = await res.json();
        if (data.erro) {
          setFieldError(cepInput, 'CEP não encontrado.');
          if (cepHint) cepHint.textContent = '';
          return;
        }
        setFieldError(cepInput, '');
        if (ruaInput && !ruaInput.value) ruaInput.value = data.logradouro || '';
        if (bairroInput && !bairroInput.value) bairroInput.value = data.bairro || '';
        if (cidadeInput) cidadeInput.value = data.localidade || '';
        if (estadoInput) estadoInput.value = data.uf || '';
        if (cepHint) cepHint.textContent = 'Endereço preenchido automaticamente. Confira e complete o número.';
      } catch (err) {
        if (cepHint) cepHint.textContent = 'Não foi possível buscar o endereço agora — preencha manualmente.';
      }
    });
  }

  /* ---------------------------------------------------------------- */
  /* Validação de telefone ao sair do campo                            */
  /* ---------------------------------------------------------------- */
  if (telInput) {
    telInput.addEventListener('blur', () => {
      const digits = onlyDigits(telInput.value);
      if (!telInput.value) return;
      if (digits.length < 10) {
        setFieldError(telInput, 'Informe o telefone com DDD (10 ou 11 dígitos).');
      } else {
        setFieldError(telInput, '');
      }
    });
  }

  /* ---------------------------------------------------------------- */
  /* Elementos usados no submit                                        */
  /* ---------------------------------------------------------------- */
  const interestChecks = form.querySelectorAll('input[name="areas"]');
  const interestGroupError = form.querySelector('#areas-error');
  const statusEl = form.querySelector('.form-status');
  const successPanel = document.getElementById('sucesso-cadastro');
  const submitBtn = form.querySelector('button[type="submit"]');

  /* ---------------------------------------------------------------- */
  /* Persistência de rascunho em localStorage                          */
  /* ---------------------------------------------------------------- */

  // Restaura rascunho ao carregar a página
  try {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      draftFields.forEach((name) => {
        const input = form.elements[name];
        if (input && data[name]) input.value = data[name];
      });
    }
  } catch (err) {
    // JSON corrompido ou localStorage indisponível — segue sem restaurar
  }

  // Salva rascunho a cada alteração
  form.addEventListener('input', () => {
    const data = {};
    draftFields.forEach((name) => {
      const input = form.elements[name];
      if (input) data[name] = input.value;
    });
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
    } catch (err) {
      // Modo privado ou cota excedida — ignora silenciosamente
    }
  });

  /* ---------------------------------------------------------------- */
  /* Submit do formulário                                              */
  /* ---------------------------------------------------------------- */
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (submitBtn.disabled) return;
    submitBtn.disabled = true;
    let valid = form.checkValidity();

    // Revalida CPF explicitamente (checkValidity cobre só o formato)
    if (cpfInput && cpfInput.value && !isValidCPF(cpfInput.value)) {
      setFieldError(cpfInput, 'CPF inválido. Confira os números digitados.');
      cpfInput.setCustomValidity('CPF inválido');
      valid = false;
    }

    // Exige ao menos uma área de interesse marcada
    const anyInterest = Array.from(interestChecks).some((c) => c.checked);
    if (!anyInterest) {
      if (interestGroupError) interestGroupError.textContent = 'Selecione ao menos uma área de interesse.';
      valid = false;
    } else if (interestGroupError) {
      interestGroupError.textContent = '';
    }

    if (!valid) {
      submitBtn.disabled = false;
      form.reportValidity();
      if (statusEl) {
        statusEl.dataset.state = 'error';
        statusEl.textContent = 'Verifique os campos destacados antes de enviar.';
      }
      showToast({
        variant: 'danger',
        title: 'Não foi possível enviar',
        text: 'Verifique os campos destacados no formulário.',
      });
      const firstInvalid = form.querySelector(':invalid, .has-error input');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    // Sem backend: simula o envio e exibe confirmação
    submitBtn.textContent = 'Enviado ✓';
    if (statusEl) {
      statusEl.dataset.state = 'ok';
      statusEl.textContent = '';
    }

    const nomeCampo = form.querySelector('#nome');
    if (successPanel) {
      const nomeSpan = successPanel.querySelector('[data-nome]');
      if (nomeSpan && nomeCampo) nomeSpan.textContent = nomeCampo.value.split(' ')[0];
      successPanel.classList.add('is-visible');
      successPanel.setAttribute('tabindex', '-1');
      successPanel.focus();
      successPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    showToast({
      variant: 'success',
      title: 'Cadastro enviado',
      text: 'Em até 5 dias úteis entraremos em contato.',
    });

    // Limpa o rascunho salvo após envio bem-sucedido
    try { localStorage.removeItem(DRAFT_KEY); } catch (err) { /* ignora */ }

    form.reset();
    form.querySelectorAll('.has-error').forEach((el) => el.classList.remove('has-error'));
    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Enviar cadastro';
    }, 2000);
  });
}