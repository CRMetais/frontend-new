import api from "./apiClient";

// ─── COMPARTILHADO ───────────────────────────────────────────────────────────

/**
 * Busca todos os preços de uma tabela pelo nome.
 * Retorna lista de { nomeTabela, dataInicioValidade, precoProduto, versao }
 * Funciona para tabelas de venda (V) e compra (C).
 */
export async function fetchPrecosPorTabela(nomeTabela) {
  const response = await api.get("/tabelas-precos/precos", {
    params: { nome: nomeTabela },
  });
  if (response.status === 204) return [];
  return response.data;
}

/**
 * Busca todos os produtos cadastrados no banco.
 * Usado para montar linhas de tabela nova (sem preços ainda).
 */
export async function fetchTodosProdutos() {
  const response = await api.get("/produtos");
  if (response.status === 204) return [];
  return response.data;
}

/**
 * Salva preços em lote para hoje.
 * Cria nova versão da tabela (tipo herdado da versão anterior) e insere os preços.
 */
export async function salvarPrecosEmLote(nomeTabela, itens) {
  await api.post("/preco-produtos-tabelas/lote", { nomeTabela, itens });
}

// ─── VENDA ───────────────────────────────────────────────────────────────────

/**
 * Busca nomes únicos de todas as tabelas de VENDA (tipo = V).
 */
export async function fetchNomesTabelasVenda() {
  const response = await api.get("/tabelas-precos/venda");
  if (response.status === 204) return [];
  const nomes = [...new Set(response.data.map((t) => t.nomeTabela))];
  return nomes.sort();
}

/**
 * Cadastra uma nova tabela de venda (tipo V, versão 1.0, data início hoje).
 */
export async function cadastrarTabelaVenda(nomeTabela) {
  const response = await api.post("/tabelas-precos/venda", { nomeTabela });
  return response.data;
}

// ─── COMPRA ──────────────────────────────────────────────────────────────────

/**
 * Busca nomes únicos de todas as tabelas de COMPRA (tipo = C).
 */
export async function fetchNomesTabelasCompra() {
  const response = await api.get("/tabelas-precos/compra");
  if (response.status === 204) return [];
  const nomes = [...new Set(response.data.map((t) => t.nomeTabela))];
  return nomes.sort();
}

/**
 * Cadastra uma nova tabela de compra (tipo C, versão 1.0, data início hoje).
 */
export async function cadastrarTabelaCompra(nomeTabela) {
  const response = await api.post("/tabelas-precos/compra", { nomeTabela });
  return response.data;
}