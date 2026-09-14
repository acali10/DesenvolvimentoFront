(() => {
  'use strict';

  /* ------------------------------------------------------------------ */
  /* Cabeçalho: sombra ao rolar + menu mobile                            */
  /* ------------------------------------------------------------------ */
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.nav__toggle');
  const links = document.querySelector('.nav__links');

  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    links.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => {
        links.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Submenu dropdown "Projetos": sincroniza aria-expanded com hover/foco */
  /* ------------------------------------------------------------------ */
  const dropdown = document.querySelector('.nav__dropdown');
  if (dropdown) {
    const trigger = dropdown.querySelector('a');
    const setExpanded = (value) => trigger.setAttribute('aria-expanded', String(value));
    dropdown.addEventListener('mouseenter', () => setExpanded(true));
    dropdown.addEventListener('mouseleave', () => setExpanded(false));
    dropdown.addEventListener('focusin', () => setExpanded(true));
    dropdown.addEventListener('focusout', (event) => {
      if (!dropdown.contains(event.relatedTarget)) setExpanded(false);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Máscaras de entrada                                                  */
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

  const bindMask = (input, maskFn) => {
    if (!input) return;
    input.addEventListener('input', (e) => {
      const cursorFromEnd = e.target.value.length - e.target.selectionStart;
      e.target.value = maskFn(e.target.value);
      const pos = e.target.value.length - cursorFromEnd;
      e.target.setSelectionRange(pos, pos);
    });
  };

  /* ------------------------------------------------------------------ */
  /* Validação de CPF (dígitos verificadores — módulo 11)                */
  /* ------------------------------------------------------------------ */
  function isValidCPF(raw) {
    const cpf = onlyDigits(raw);
    if (cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false; // sequências como 111.111.111-11

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
  /* Formulário de cadastro                                              */
  /* ------------------------------------------------------------------ */
  const form = document.getElementById('form-cadastro');
  if (!form) return;

  const cpfInput = form.querySelector('#cpf');
  const telInput = form.querySelector('#telefone');
  const cepInput = form.querySelector('#cep');

  bindMask(cpfInput, maskCPF);
  bindMask(telInput, maskTelefone);
  bindMask(cepInput, maskCEP);

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

  // Validação de CPF em tempo real, ao sair do campo
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

  // Busca de endereço pelo CEP (ViaCEP) — melhoria progressiva
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

  // Validação de telefone (10 ou 11 dígitos)
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

  // Ao menos uma área de interesse selecionada
  const interestChecks = form.querySelectorAll('input[name="areas"]');
  const interestGroupError = form.querySelector('#areas-error');

  const statusEl = form.querySelector('.form-status');
  const successPanel = document.getElementById('sucesso-cadastro');
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (submitBtn.disabled) return; // evita clique duplo enquanto processa
    submitBtn.disabled = true;
    let valid = form.checkValidity();

    // Revalida CPF explicitamente (checkValidity só cobre o padrão de formato)
    if (cpfInput && cpfInput.value && !isValidCPF(cpfInput.value)) {
      setFieldError(cpfInput, 'CPF inválido. Confira os números digitados.');
      cpfInput.setCustomValidity('CPF inválido');
      valid = false;
    }

    const anyInterest = Array.from(interestChecks).some((c) => c.checked);
    if (!anyInterest) {
      if (interestGroupError) interestGroupError.textContent = 'Selecione ao menos uma área de interesse.';
      valid = false;
    } else if (interestGroupError) {
      interestGroupError.textContent = '';
    }

    if (!valid) {
      submitBtn.disabled = false; // reabilita para o usuário corrigir e reenviar
      form.reportValidity();
      if (statusEl) {
        statusEl.dataset.state = 'error';
        statusEl.textContent = 'Verifique os campos destacados antes de enviar.';
      }
      const firstInvalid = form.querySelector(':invalid, .has-error input');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    // Sem backend nesta entrega: simula o envio e exibe confirmação.
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
    form.reset();
    form.querySelectorAll('.has-error').forEach((el) => el.classList.remove('has-error'));
    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Enviar cadastro';
    }, 2000);
  });
})();