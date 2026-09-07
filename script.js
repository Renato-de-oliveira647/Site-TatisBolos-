const STORAGE_KEY = 'tatais-bolo-data';

const defaultStories = [
  {
    id: crypto.randomUUID(),
    title: 'Bolo de aniversário',
    imageUrl: './img/bolo-aniversario.svg'
  },
  {
    id: crypto.randomUUID(),
    title: 'Detalhes da cobertura',
    imageUrl: './img/detalhes-cobertura.svg'
  },
  {
    id: crypto.randomUUID(),
    title: 'Bolo personalizado',
    imageUrl: './img/bolo-personalizado.svg'
  },
  {
    id: crypto.randomUUID(),
    title: 'Doces para festa',
    imageUrl: './img/doces-festa.svg'
  }
];

const defaultState = {
  orders: [
    {
      id: crypto.randomUUID(),
      cliente: 'Maria Souza',
      tipo: 'Bolo de chocolate com morango',
      tamanho: 'Médio',
      dataEntrega: '2026-09-15',
      valor: 250,
      status: 'Pendente',
      observacoes: 'Mensagem: Parabéns, Maria!'
    },
    {
      id: crypto.randomUUID(),
      cliente: 'João Pereira',
      tipo: 'Bolo de baunilha com cobertura de chantilly',
      tamanho: 'Grande',
      dataEntrega: '2026-09-18',
      valor: 390,
      status: 'Em produção',
      observacoes: 'Com tema azul e flores brancas.'
    }
  ],
  finances: [
    { id: crypto.randomUUID(), descricao: 'Pagamento de bolo da Maria', tipo: 'entrada', valor: 250, data: '2026-09-10' },
    { id: crypto.randomUUID(), descricao: 'Compra de ingredientes', tipo: 'saida', valor: 120, data: '2026-09-12' }
  ],
  stories: defaultStories
};

const state = loadState();

const orderForm = document.querySelector('#order-form');
const financeForm = document.querySelector('#finance-form');
const storyForm = document.querySelector('#story-form');
const ordersList = document.querySelector('#orders-list');
const financeList = document.querySelector('#finance-list');
const storiesList = document.querySelector('#stories-list');
const printOrdersButton = document.querySelector('#print-orders');
const printAllOrdersButton = document.querySelector('#print-all-orders');
const printFinanceButton = document.querySelector('#print-finance');
const printArea = document.querySelector('#print-area');

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return structuredClone(defaultState);
  }

  try {
    const parsed = JSON.parse(saved);
    return {
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
      finances: Array.isArray(parsed.finances) ? parsed.finances : [],
      stories: Array.isArray(parsed.stories) && parsed.stories.length ? parsed.stories : structuredClone(defaultStories)
    };
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return 'Sem data';
  const date = new Date(value + 'T00:00:00');
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(date);
}

function getOrderStatusClass(status) {
  const normalized = status.toLowerCase().replace(/\s+/g, '-');
  const map = {
    pendente: 'pending',
    'em-produção': 'production',
    pronto: 'ready',
    entregue: 'delivered'
  };

  return map[normalized] || 'pending';
}

function getSummary() {
  const totalPedidos = state.orders.length;
  const receita = state.orders.reduce((acc, order) => acc + Number(order.valor || 0), 0);
  const entradas = state.finances
    .filter((item) => item.tipo === 'entrada')
    .reduce((acc, item) => acc + Number(item.valor || 0), 0);
  const saidas = state.finances
    .filter((item) => item.tipo === 'saida')
    .reduce((acc, item) => acc + Number(item.valor || 0), 0);

  return { totalPedidos, receita, entradas, saidas };
}

function renderSummary() {
  const { totalPedidos, receita, entradas, saidas } = getSummary();

  document.querySelector('#summary-orders').textContent = totalPedidos;
  document.querySelector('#summary-revenue').textContent = formatCurrency(receita);
  document.querySelector('#summary-entries').textContent = formatCurrency(entradas);
  document.querySelector('#summary-exits').textContent = formatCurrency(saidas);
}

function renderOrders() {
  if (!state.orders.length) {
    ordersList.innerHTML = '<div class="empty-state">Nenhum pedido registrado ainda.</div>';
    return;
  }

  ordersList.innerHTML = state.orders
    .slice()
    .reverse()
    .map(
      (order) => `
        <article class="order-card">
          <div class="order-top">
            <h3>${order.cliente}</h3>
            <span class="status-pill ${getOrderStatusClass(order.status)}">${order.status}</span>
          </div>
          <div class="order-meta">
            <span>${order.tipo}</span>
            <span>${order.tamanho}</span>
            <span>${formatDate(order.dataEntrega)}</span>
          </div>
          <div class="order-footer">
            <div>
              <div class="amount">${formatCurrency(order.valor)}</div>
              <small>${order.observacoes || 'Sem observações'}</small>
            </div>
            <div class="action-buttons">
              <button class="icon-btn" type="button" data-action="print-order" data-id="${order.id}">Imprimir</button>
              <button class="icon-btn danger" type="button" data-action="delete-order" data-id="${order.id}">Excluir</button>
            </div>
          </div>
        </article>
      `
    )
    .join('');
}

function renderFinances() {
  if (!state.finances.length) {
    financeList.innerHTML = '<div class="empty-state">Nenhuma movimentação registrada.</div>';
    return;
  }

  financeList.innerHTML = state.finances
    .slice()
    .reverse()
    .map(
      (item) => `
        <article class="finance-card">
          <div class="finance-top">
            <h3>${item.descricao}</h3>
            <span class="status-pill ${item.tipo === 'entrada' ? 'ready' : 'pending'}">${item.tipo === 'entrada' ? 'Entrada' : 'Saída'}</span>
          </div>
          <div class="finance-meta">
            <span>${formatDate(item.data)}</span>
          </div>
          <div class="finance-footer">
            <div class="amount ${item.tipo === 'entrada' ? 'positive' : 'negative'}">
              ${item.tipo === 'entrada' ? '+' : '-'} ${formatCurrency(item.valor)}
            </div>
            <button class="icon-btn danger" type="button" data-action="delete-finance" data-id="${item.id}">Excluir</button>
          </div>
        </article>
      `
    )
    .join('');
}

function renderStories() {
  if (!state.stories.length) {
    storiesList.innerHTML = '<div class="empty-state">Ainda não há stories para mostrar.</div>';
    return;
  }

  storiesList.innerHTML = state.stories
    .slice()
    .reverse()
    .map(
      (story) => `
        <article class="story-card">
          <img src="${story.imageUrl}" alt="${story.title}" />
          <div class="story-info">
            <h3>${story.title}</h3>
            <a href="https://instagram.com/tatis_bolos" target="_blank" rel="noreferrer">@tatis_bolos</a>
          </div>
        </article>
      `
    )
    .join('');
}

function renderAll() {
  renderSummary();
  renderOrders();
  renderFinances();
  renderStories();
}

function addOrder(event) {
  event.preventDefault();
  const formData = new FormData(orderForm);

  if (!formData.get('lgpd')) {
    alert('Você precisa aceitar a Política de Privacidade para concluir o pedido.');
    return;
  }

  const newOrder = {
    id: crypto.randomUUID(),
    cliente: formData.get('cliente').trim(),
    tipo: formData.get('tipo').trim(),
    tamanho: formData.get('tamanho'),
    dataEntrega: formData.get('dataEntrega'),
    valor: Number(formData.get('valor') || 0),
    status: formData.get('status'),
    observacoes: formData.get('observacoes').trim()
  };

  if (!newOrder.cliente || !newOrder.tipo || !newOrder.dataEntrega) {
    return;
  }

  state.orders.push(newOrder);
  saveState();
  renderAll();
  orderForm.reset();
  orderForm.querySelector('[name="tamanho"]').value = 'Médio';
  orderForm.querySelector('[name="status"]').value = 'Pendente';
}

function addFinance(event) {
  event.preventDefault();
  const formData = new FormData(financeForm);
  const descricao = formData.get('descricao').trim();
  const tipo = formData.get('tipo');
  const valor = Number(formData.get('valor') || 0);
  const data = formData.get('data');

  if (!descricao || !data || !valor) {
    return;
  }

  state.finances.push({
    id: crypto.randomUUID(),
    descricao,
    tipo,
    valor,
    data
  });

  saveState();
  renderAll();
  financeForm.reset();
}

function addStory(event) {
  event.preventDefault();
  const formData = new FormData(storyForm);
  const title = formData.get('title').trim();
  const imageUrl = formData.get('imageUrl').trim();

  if (!title || !imageUrl) {
    return;
  }

  state.stories.push({
    id: crypto.randomUUID(),
    title,
    imageUrl
  });

  saveState();
  renderStories();
  storyForm.reset();
}

function deleteOrder(id) {
  state.orders = state.orders.filter((order) => order.id !== id);
  saveState();
  renderAll();
}

function deleteFinance(id) {
  state.finances = state.finances.filter((item) => item.id !== id);
  saveState();
  renderAll();
}

function printPrintableList(title, items) {
  const htmlItems = items.length
    ? items
        .map(
          (item) => `
            <div class="print-box">
              <h3>${item.cliente || item.descricao}</h3>
              <p><strong>Tipo:</strong> ${item.tipo || item.data || '---'}</p>
              <p><strong>Data:</strong> ${formatDate(item.dataEntrega || item.data)}</p>
              <p><strong>Valor:</strong> ${formatCurrency(item.valor || 0)}</p>
              ${(item.status ? `<p><strong>Status:</strong> ${item.status}</p>` : '')}
              ${(item.observacoes ? `<p><strong>Obs:</strong> ${item.observacoes}</p>` : '')}
            </div>
          `
        )
        .join('')
    : '<div class="print-box"><p>Nenhum registro para imprimir.</p></div>';

  printArea.innerHTML = `
    <h1>${title}</h1>
    ${htmlItems}
  `;
  window.print();
}

function printOrdersList() {
  const list = state.orders.map((order) => ({
    cliente: order.cliente,
    tipo: order.tipo,
    dataEntrega: order.dataEntrega,
    valor: order.valor,
    status: order.status,
    observacoes: order.observacoes
  }));
  printPrintableList('Pedidos da confeitaria', list);
}

function printFinanceList() {
  const list = state.finances.map((item) => ({
    descricao: item.descricao,
    tipo: item.tipo,
    data: item.data,
    valor: item.valor
  }));
  printPrintableList('Controle financeiro', list);
}

orderForm.addEventListener('submit', addOrder);
financeForm.addEventListener('submit', addFinance);
storyForm.addEventListener('submit', addStory);
printOrdersButton.addEventListener('click', printOrdersList);
printAllOrdersButton.addEventListener('click', printOrdersList);
printFinanceButton.addEventListener('click', printFinanceList);

document.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;

  const action = button.dataset.action;
  const id = button.dataset.id;

  if (action === 'delete-order') deleteOrder(id);
  if (action === 'delete-finance') deleteFinance(id);
  if (action === 'print-order') {
    const order = state.orders.find((item) => item.id === id);
    if (order) {
      printPrintableList('Pedido', [{
        cliente: order.cliente,
        tipo: order.tipo,
        dataEntrega: order.dataEntrega,
        valor: order.valor,
        status: order.status,
        observacoes: order.observacoes
      }]);
    }
  }
});

renderAll();
