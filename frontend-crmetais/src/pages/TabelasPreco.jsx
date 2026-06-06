import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { isUsuarioComum } from "../services/UsuarioService";
import {
  fetchPrecosPorTabela,
  fetchNomesTabelasVenda,
  fetchNomesTabelasCompra,
  cadastrarTabelaVenda,
  cadastrarTabelaCompra,
  fetchTodosProdutos,
  salvarPrecosEmLote,
} from "../services/TabelasPrecoService";
import TabelaGenerica from "../components/TabelaGenerica";
import Navbar from "../components/Navbar";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isoParaDDMM(iso) {
  if (!iso) return "—";
  const [, m, d] = String(iso).split("-");
  return `${d}/${m}`;
}

function isoParaExtenso(iso) {
  if (!iso) return "";
  const [ano, m, d] = iso.split("-");
  const meses = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
  return `${d}/${meses[parseInt(m, 10) - 1]}/${ano}`;
}

function hojeISO() { return new Date().toISOString().slice(0, 10); }
function hojeDDMM() { return isoParaDDMM(hojeISO()); }

function parseBRL(valor) {
  if (valor === null || valor === undefined || valor === "—" || valor === "") return null;
  if (typeof valor === "number") return valor;
  const cleaned = String(valor)
    .replace("R$", "").replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function formatBRL(valor) {
  if (valor === null || valor === undefined) return "—";
  return `R$ ${Number(valor).toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

function separarProdutos(produtos) {
  const pc = [], ferro = [], metais = [];
  for (const p of produtos) {
    if (p.startsWith("PC - ")) pc.push(p);
    else if (p.startsWith("Ferro ")) ferro.push(p);
    else metais.push(p);
  }
  return { metais, pc, ferro };
}

function calcMargem(precoCliente, precoVital) {
  const c = parseBRL(precoCliente);
  const v = parseBRL(precoVital);
  if (c === null || v === null) return null;
  return Math.round((v - c) * 100) / 100;
}

function corMargem(margem) {
  if (margem === null) return { bg: "transparent", color: "#aaa" };
  if (margem > 0)  return { bg: "#dcfce7", color: "#15803d" };
  if (margem === 0) return { bg: "#fef9c3", color: "#a18a07" };
  return              { bg: "#fee2e2", color: "#b91c1c" };
}

// ─── buildTableModel — Venda ──────────────────────────────────────────────────

function buildTableModelVenda(rows, todosProdutos = [], tabelaNova = false) {
  const isoSet     = new Set();
  const productSet = new Set();
  const valueMap   = new Map(); // chave: "nomeProduto||isoDate"
  const versaoMap  = new Map(); // chave: isoDate
  const isoMap     = new Map(); // ddmm → iso (para exibição)

  for (const r of rows) {
    const nome   = String(r.nomeTabela ?? "").trim();
    const iso    = String(r.dataInicioValidade ?? "").trim();
    const preco  = r.precoProduto ?? null;
    const versao = r.versao ?? null;
    if (!nome || !iso) continue;

    isoSet.add(iso);
    productSet.add(nome);
    valueMap.set(`${nome}||${iso}`, preco);   // ← chave única por produto+data ISO
    if (!versaoMap.has(iso)) versaoMap.set(iso, versao);
  }

  if (tabelaNova) {
    const iso = hojeISO();
    isoSet.add(iso);
    versaoMap.set(iso, 1.0);
    for (const p of todosProdutos) productSet.add(p.nome);
  }

  // Ordena ISO desc — sem ambiguidade entre anos
  const datasISO = Array.from(isoSet).sort((a, b) => b.localeCompare(a));
  const produtos  = Array.from(productSet).sort((a, b) => a.localeCompare(b, "pt-BR"));
  return { datasISO, produtos, valueMap, versaoMap };
}

// ─── buildTableModel — Compra ─────────────────────────────────────────────────

function buildTableModelCompra(rows, todosProdutos = [], tabelaNova = false) {
  const productSet = new Set();
  const valueMap = new Map();
  let versao = null;
  let dataAtual = null;

  const vistos = new Set();
  for (const r of rows) {
    const nome  = String(r.nomeTabela ?? "").trim();
    const iso   = String(r.dataInicioValidade ?? "").trim();
    const preco = r.precoProduto ?? null;
    if (!nome) continue;
    if (!vistos.has(nome)) {
      vistos.add(nome);
      productSet.add(nome);
      valueMap.set(nome, preco);
      if (!versao) versao = r.versao;
      if (!dataAtual) dataAtual = iso;
    }
  }

  if (tabelaNova) {
    dataAtual = hojeISO();
    versao = 1.0;
    for (const p of todosProdutos) productSet.add(p.nome);
  }

  const produtos = Array.from(productSet).sort((a, b) => a.localeCompare(b, "pt-BR"));
  return { produtos, valueMap, versao, dataAtual };
}

// ─── ModalNovaTabela ──────────────────────────────────────────────────────────

function ModalNovaTabela({ tipo, onConfirmar, onClose, salvando }) {
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState("");

  function handleConfirmar() {
    const nomeTrimmed = nome.trim().toUpperCase();
    if (!nomeTrimmed) { setErro("O nome é obrigatório."); return; }
    setErro("");
    onConfirmar(nomeTrimmed);
  }

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ background: "rgba(0,0,0,0.45)", zIndex: 1055 }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3 p-4 shadow-lg"
        style={{ width: "100%", maxWidth: 420 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold mb-0">
            Nova tabela de {tipo === "venda" ? "venda" : "compra"}
          </h5>
          <button className="btn-close" onClick={onClose} disabled={salvando} />
        </div>

        <div className="mb-3">
          <label className="form-label fw-semibold small">Nome da tabela</label>
          <input
            className="form-control text-uppercase"
            placeholder={tipo === "venda" ? "Ex: TOCANTINS" : "Ex: PADRAO"}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleConfirmar()}
            autoFocus
          />
          {erro && <div className="text-danger small mt-1">{erro}</div>}
          <div className="text-muted small mt-2">
            Será criada com tipo {tipo === "venda" ? "Venda" : "Compra"}, versão 1.0 e data de início hoje.
          </div>
        </div>

        <div className="d-flex justify-content-end gap-2">
          <button className="btn btn-secondary" onClick={onClose} disabled={salvando}>
            Fechar
          </button>
          <button className="btn btn-primary fw-semibold" onClick={handleConfirmar} disabled={salvando}>
            {salvando ? "Criando..." : "Criar tabela"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PreviewImagem ────────────────────────────────────────────────────────────

function PreviewImagem({ produtos, valueMap, onClose }) {
  const previewRef = useRef(null);
  const [copiando, setCopiando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const { metais, pc, ferro } = separarProdutos(produtos);
  const dataHoje = isoParaExtenso(hojeISO());

  // async function handleCopiar() { ... }

  function TabelaPreview({ titulo, itens, obs }) {
    if (!itens.length) return null;
    return (
      <div className="mb-3">
        <div className="fw-bold small text-center py-1 mb-1" style={{ background: "#FACC15", letterSpacing: 1 }}>
          {titulo}
        </div>
        <table className="table table-sm mb-0" style={{ fontSize: "0.8rem" }}>
          <thead className="table-dark">
            <tr>
              <th>Produto</th>
              <th className="text-end">Preço (R$)</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((nome, i) => (
              <tr key={nome} className={i % 2 === 0 ? "" : "table-light"}>
                <td>{nome}</td>
                <td className="text-end">{formatBRL(valueMap.get(nome))}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {obs && <div className="text-center text-muted" style={{ fontSize: "0.72rem", fontStyle: "italic" }}>{obs}</div>}
      </div>
    );
  }

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ background: "rgba(0,0,0,0.55)", zIndex: 1055 }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3 shadow-lg"
        style={{ width: "100%", maxWidth: 680, maxHeight: "90vh", overflow: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="d-flex justify-content-between align-items-center px-4 py-3 border-bottom">
          <span className="fw-bold">Copiar tabela como imagem</span>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Fechar</button>
        </div>
        <div ref={previewRef} className="p-4 bg-white">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div style={{ fontWeight: 900, fontSize: "1.3rem" }}>
              CR<span style={{ fontWeight: 400 }}>|metais</span>
            </div>
            <div className="text-end">
              <div className="fw-bold" style={{ fontSize: "1rem" }}>TABELA DE PREÇOS (DIÁRIA)</div>
              <div className="text-muted small">{dataHoje}</div>
            </div>
          </div>
          <div className="row g-3">
            <div className="col-6"><TabelaPreview titulo="METAIS" itens={metais} /></div>
            <div className="col-6">
              <TabelaPreview titulo="PLACAS ELETRÔNICAS" itens={pc} />
              <TabelaPreview titulo="FERRO" itens={ferro} obs="Obs. Ferro somente entrega" />
            </div>
          </div>
        </div>
        <div className="d-flex justify-content-center align-items-center gap-3 px-4 py-3 border-top">
          {copiado && <span className="text-success fw-semibold small">Imagem copiada com sucesso!</span>}
          <button className="btn btn-dark fw-bold px-4" onClick={() => {}} disabled={copiando}>
            {copiando ? "Gerando..." : "Copiar tabela"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────

function Toolbar({
  tabelas, tabela, onChangeTabela, loading,
  usuarioComum, onNovaTabela,
  produtos, versao, dataAtual,
  temEdicoes, qtdEdicoes, salvando,
  onSalvar, onCancelar,
  onCopiar,
}) {
  return (
    <div className="d-flex flex-wrap align-items-center gap-2 px-3 py-2 border-bottom bg-white">

      {/* Seletor */}
      <select
        className="form-select form-select-sm"
        style={{ width: "auto", minWidth: 140 }}
        value={tabela}
        onChange={(e) => onChangeTabela(e.target.value)}
        disabled={loading}
      >
        {tabelas.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>

      {/* Badge versão */}
      {versao && !loading && (
        <span className="badge bg-secondary">v{versao}</span>
      )}

      {/* Data atualização */}
      {dataAtual && !loading && (
        <span className="text-muted small">{isoParaExtenso(dataAtual)}</span>
      )}

      {/* Contador */}
      {!loading && (
        <span className="text-muted small">{produtos.length} produto(s)</span>
      )}
      {loading && <span className="text-muted small">Carregando...</span>}

      {/* Spacer */}
      <div className="ms-auto d-flex flex-wrap align-items-center gap-2">

        {/* Aviso de edições pendentes */}
        {temEdicoes && !usuarioComum && (
          <span className="text-warning-emphasis small fw-semibold">
            {qtdEdicoes} alteração(ões)
          </span>
        )}

        {/* Ações admin */}
        {!usuarioComum && (
          <>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={onCancelar}
              disabled={!temEdicoes || salvando}
            >
              Cancelar
            </button>
            <button
              className="btn btn-sm btn-primary"
              onClick={onSalvar}
              disabled={salvando || loading || !temEdicoes}
            >
              {salvando ? "Salvando..." : "Salvar preços"}
            </button>
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={onNovaTabela}
              disabled={loading}
            >
              + Nova tabela
            </button>
          </>
        )}

        {/* Copiar — só compra */}
        {onCopiar && (
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={onCopiar}
            disabled={loading || produtos.length === 0}
          >
            Copiar tabela
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Estilo inline para input de célula (sem borda, sem fundo) ───────────────

const cellInputStyle = {
  border: "none",
  outline: "none",
  background: "transparent",
  width: "100%",
  minWidth: 90,
  fontSize: "inherit",
  fontFamily: "inherit",
  padding: 0,
};

// ─── Aba Venda ────────────────────────────────────────────────────────────────

function AbaVenda({ usuarioComum }) {
  const [tabelas, setTabelas]             = useState([]);
  const [tabela, setTabela]               = useState("");
  const [rows, setRows]                   = useState([]);
  const [todosProdutos, setTodosProdutos] = useState([]);
  const [tabelaNova, setTabelaNova]       = useState(false);
  const [loading, setLoading]             = useState(false);
  const [salvando, setSalvando]           = useState(false);
  const [criandoTabela, setCriandoTabela] = useState(false);
  const [showModal, setShowModal]         = useState(false);
  const [erro, setErro]                   = useState("");
  const [sucesso, setSucesso]             = useState("");
  const [edits, setEdits]                 = useState({});

  const carregarTabelas = useCallback(async () => {
    try {
      const nomes = await fetchNomesTabelasVenda();
      setTabelas(nomes);
      if (nomes.length > 0 && !tabela) setTabela(nomes[0]);
    } catch { setTabelas([]); }
  }, [tabela]);

  useEffect(() => { carregarTabelas(); }, []);
  useEffect(() => {
    fetchTodosProdutos()
      .then((d) => setTodosProdutos(Array.isArray(d) ? d : []))
      .catch(() => setTodosProdutos([]));
  }, []);

  const carregarDados = useCallback(async (t) => {
    if (!t) return;
    setLoading(true); setErro(""); setSucesso(""); setEdits({}); setTabelaNova(false);
    try {
      const data = await fetchPrecosPorTabela(t);
      setRows(Array.isArray(data) ? data : []);
      if (!data || data.length === 0) setTabelaNova(true);
    } catch (e) {
      setRows([]);
      setErro(e?.response?.data?.message || e?.message || "Erro ao carregar dados");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (tabela) carregarDados(tabela); }, [tabela, carregarDados]);

  const { datasISO, produtos, valueMap, versaoMap } = useMemo(
    () => buildTableModelVenda(rows, todosProdutos, tabelaNova),
    [rows, todosProdutos, tabelaNova]
  );

  const isoMaisRecente = datasISO[0];
const versaoAtual    = isoMaisRecente ? versaoMap.get(isoMaisRecente) : null;

function handleCellChange(nome, iso, valor) {
  const key = `${nome}||${iso}`;
  setEdits((prev) => ({ ...prev, [key]: valor }));
}

function handleCellBlur(nome, iso, valorDigitado) {
  const key       = `${nome}||${iso}`;
  const nDigitado = parseBRL(valorDigitado);
  const nOriginal = parseBRL(valueMap.get(key));
  if (nDigitado === null || nDigitado === nOriginal) {
    setEdits((prev) => { const next = { ...prev }; delete next[key]; return next; });
    return;
  }
  setEdits((prev) => ({ ...prev, [key]: formatBRL(nDigitado) }));
}

 async function handleSalvar() {
  const itens = produtos
    .map((nome) => {
      const key        = `${nome}||${isoMaisRecente}`;
      const valorFinal = edits[key] !== undefined ? edits[key] : valueMap.get(key);
      return { nomeProduto: nome, preco: parseBRL(valorFinal) };
    })
    .filter((i) => i.preco !== null && i.preco > 0);
  await salvarPrecosEmLote(tabela, itens);
      setSucesso("Preços salvos. Nova versão criada.");
      setTabelaNova(false);
      await carregarDados(tabela);
  }

  async function handleCriarTabela(nomeTabela) {
    setCriandoTabela(true); setErro("");
    try {
      await cadastrarTabelaVenda(nomeTabela);
      await carregarTabelas();
      setTabela(nomeTabela);
      setShowModal(false);
      setSucesso(`Tabela "${nomeTabela}" criada.`);
    } catch (e) {
      setErro(e?.response?.data?.message || e?.message || "Erro ao criar tabela");
      setShowModal(false);
    } finally { setCriandoTabela(false); }
  }

  const temEdicoes = Object.keys(edits).length > 0;
  const qtdEdicoes = Object.keys(edits).length;

  const colunas = useMemo(() => [
  { key: "produto", label: "Produto", sortable: true },
  ...datasISO.map((iso, idx) => ({          // ← datasISO em vez de datas
    key: `data_${iso}`,                      // ← chave única com ISO
    label: isoParaDDMM(iso),                 // ← exibe DD/MM
    sortable: false,
    render: (row) => {
      const nome     = row.produto;
      const key      = `${nome}||${iso}`;    // ← chave com ISO
      const current  = valueMap.get(key) ?? null;
      const prevISO  = datasISO[idx + 1];
      const prev     = prevISO ? (valueMap.get(`${nome}||${prevISO}`) ?? null) : null;

      let trendStyle = {};
      if (!usuarioComum && prevISO) {
        const c = parseBRL(current);
        const p = parseBRL(prev);
        if (c !== null && p !== null) {
          if (c > p) trendStyle = { color: "#15803d" };
          else if (c < p) trendStyle = { color: "#b91c1c" };
        }
      }

      const isEditavel   = idx === 0 && !usuarioComum;
      const editVal      = edits[key];        // ← chave com ISO
      const displayValue = editVal !== undefined ? editVal : formatBRL(current);

      return isEditavel ? (
        <input
          style={{ ...cellInputStyle, ...trendStyle }}
          value={displayValue}
          onChange={(e) => handleCellChange(nome, iso, e.target.value)}   // ← passa iso
          onFocus={(e) => e.target.select()}
          onBlur={(e) => handleCellBlur(nome, iso, e.target.value)}       // ← passa iso
        />
      ) : (
        <span style={trendStyle}>{displayValue}</span>
      );
    },
  })),
], [datasISO, valueMap, edits, usuarioComum]);

  const dadosTabela = useMemo(
    () => produtos.map((nome) => ({ _rowKey: nome, produto: nome })),
    [produtos]
  );

  return (
    <>
      {showModal && (
        <ModalNovaTabela
          tipo="venda"
          onConfirmar={handleCriarTabela}
          onClose={() => setShowModal(false)}
          salvando={criandoTabela}
        />
      )}

      <Toolbar
        tabelas={tabelas} tabela={tabela} onChangeTabela={setTabela}
        loading={loading} usuarioComum={usuarioComum} onNovaTabela={() => setShowModal(true)}
        produtos={produtos} versao={versaoAtual} dataAtual={null}
        temEdicoes={temEdicoes} qtdEdicoes={qtdEdicoes} salvando={salvando}
        onSalvar={handleSalvar} onCancelar={() => setEdits({})}
      />

      {(erro || sucesso) && (
        <div className="px-3 pt-2">
          {erro    && <div className="alert alert-danger py-1 small mb-1">{erro}</div>}
          {sucesso && <div className="alert alert-success py-1 small mb-1">{sucesso}</div>}
        </div>
      )}

      <TabelaGenerica
        columns={colunas}
        data={dadosTabela}
        emptyMessage="Nenhum produto encontrado"
      />
    </>
  );
}

// ─── Aba Compra ───────────────────────────────────────────────────────────────

function AbaCompra({ usuarioComum }) {
  const [tabelas, setTabelas]             = useState([]);
  const [tabela, setTabela]               = useState("");
  const [rows, setRows]                   = useState([]);
  const [vitalRows, setVitalRows]         = useState([]);
  const [todosProdutos, setTodosProdutos] = useState([]);
  const [tabelaNova, setTabelaNova]       = useState(false);
  const [loading, setLoading]             = useState(false);
  const [salvando, setSalvando]           = useState(false);
  const [criandoTabela, setCriandoTabela] = useState(false);
  const [showModal, setShowModal]         = useState(false);
  const [showPreview, setShowPreview]     = useState(false);
  const [erro, setErro]                   = useState("");
  const [sucesso, setSucesso]             = useState("");
  const [edits, setEdits]                 = useState({});

  const carregarTabelas = useCallback(async () => {
    try {
      const nomes = await fetchNomesTabelasCompra();
      setTabelas(nomes);
      if (nomes.length > 0 && !tabela) setTabela(nomes[0]);
    } catch { setTabelas([]); }
  }, [tabela]);

  useEffect(() => { carregarTabelas(); }, []);
  useEffect(() => {
    fetchTodosProdutos()
      .then((d) => setTodosProdutos(Array.isArray(d) ? d : []))
      .catch(() => setTodosProdutos([]));
  }, []);
  useEffect(() => {
    fetchPrecosPorTabela("VITAL")
      .then((d) => setVitalRows(Array.isArray(d) ? d : []))
      .catch(() => setVitalRows([]));
  }, []);

  const carregarDados = useCallback(async (t) => {
    if (!t) return;
    setLoading(true); setErro(""); setSucesso(""); setEdits({}); setTabelaNova(false);
    try {
      const data = await fetchPrecosPorTabela(t);
      setRows(Array.isArray(data) ? data : []);
      if (!data || data.length === 0) setTabelaNova(true);
    } catch (e) {
      setRows([]);
      setErro(e?.response?.data?.message || e?.message || "Erro ao carregar dados");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (tabela) carregarDados(tabela); }, [tabela, carregarDados]);

  const { produtos, valueMap, versao, dataAtual } = useMemo(
    () => buildTableModelCompra(rows, todosProdutos, tabelaNova),
    [rows, todosProdutos, tabelaNova]
  );

  const vitalMap = useMemo(() => {
    const m = new Map();
    const vistos = new Set();
    for (const r of vitalRows) {
      const nome = String(r.nomeTabela ?? "").trim();
      if (!nome || vistos.has(nome)) continue;
      vistos.add(nome);
      m.set(nome, r.precoProduto ?? null);
    }
    return m;
  }, [vitalRows]);

  const { metais, pc, ferro } = useMemo(() => separarProdutos(produtos), [produtos]);

  function handleCellChange(nome, valor) {
    setEdits((prev) => ({ ...prev, [nome]: valor }));
  }

  function handleCellBlur(nome, valorDigitado) {
    const nDigitado = parseBRL(valorDigitado);
    const nOriginal = parseBRL(valueMap.get(nome));
    if (nDigitado === null || nDigitado === nOriginal) {
      setEdits((prev) => { const next = { ...prev }; delete next[nome]; return next; });
      return;
    }
    handleCellChange(nome, formatBRL(nDigitado));
  }

  async function handleSalvar() {
    setSalvando(true); setErro(""); setSucesso("");
    try {
      const itens = produtos
        .map((nome) => {
          const valorFinal = edits[nome] !== undefined ? edits[nome] : valueMap.get(nome);
          return { nomeProduto: nome, preco: parseBRL(valorFinal) };
        })
        .filter((i) => i.preco !== null && i.preco > 0);
      await salvarPrecosEmLote(tabela, itens);
      setSucesso("Preços salvos. Nova versão criada.");
      setTabelaNova(false);
      await carregarDados(tabela);
    } catch (e) {
      setErro(e?.response?.data?.message || e?.message || "Erro ao salvar");
    } finally { setSalvando(false); }
  }

  async function handleCriarTabela(nomeTabela) {
    setCriandoTabela(true); setErro("");
    try {
      await cadastrarTabelaCompra(nomeTabela);
      await carregarTabelas();
      setTabela(nomeTabela);
      setShowModal(false);
      setSucesso(`Tabela "${nomeTabela}" criada.`);
    } catch (e) {
      setErro(e?.response?.data?.message || e?.message || "Erro ao criar tabela");
      setShowModal(false);
    } finally { setCriandoTabela(false); }
  }

  const temEdicoes = Object.keys(edits).length > 0;
  const qtdEdicoes = Object.keys(edits).length;

  const valueMapComEdits = useMemo(() => {
    const m = new Map(valueMap);
    for (const [nome, valor] of Object.entries(edits)) {
      const n = parseBRL(valor);
      if (n !== null) m.set(nome, n);
    }
    return m;
  }, [valueMap, edits]);

  // Colunas: Produto | Preço | Margem — usadas pelos três grupos
  const colunasCompra = useMemo(() => [
    { key: "produto", label: "Produto", sortable: true },
    {
      key: "preco",
      label: "Preço (R$)",
      sortable: false,
      render: (row) => {
        const nome         = row.produto;
        const valorEdit    = edits[nome];
        const displayValue = valorEdit !== undefined ? valorEdit : formatBRL(valueMap.get(nome) ?? null);
        return !usuarioComum ? (
          <input
            style={cellInputStyle}
            value={displayValue}
            onChange={(e) => handleCellChange(nome, e.target.value)}
            onFocus={(e) => e.target.select()}
            onBlur={(e) => handleCellBlur(nome, e.target.value)}
          />
        ) : displayValue;
      },
    },
    {
      key: "margem",
      label: "Margem",
      sortable: false,
      render: (row) => {
        const nome          = row.produto;
        const precoCliente  = valueMap.get(nome) ?? null;
        const precoVital    = vitalMap.get(nome) ?? null;
        const margem        = calcMargem(precoCliente, precoVital);
        const { bg, color } = corMargem(margem);
        return (
          <span
            className="badge rounded-pill px-2 py-1 fw-bold"
            style={{ background: bg, color, fontSize: "0.78rem" }}
          >
            {margem !== null ? formatBRL(margem) : "—"}
          </span>
        );
      },
    },
  ], [edits, valueMap, vitalMap, usuarioComum]);

  function dadosGrupo(lista) {
    return lista.map((nome) => ({ _rowKey: nome, produto: nome }));
  }

  return (
    <>
      {showModal && (
        <ModalNovaTabela
          tipo="compra"
          onConfirmar={handleCriarTabela}
          onClose={() => setShowModal(false)}
          salvando={criandoTabela}
        />
      )}
      {showPreview && (
        <PreviewImagem
          produtos={produtos}
          valueMap={valueMapComEdits}
          onClose={() => setShowPreview(false)}
        />
      )}

      <Toolbar
        tabelas={tabelas} tabela={tabela} onChangeTabela={setTabela}
        loading={loading} usuarioComum={usuarioComum} onNovaTabela={() => setShowModal(true)}
        produtos={produtos} versao={versao} dataAtual={dataAtual}
        temEdicoes={temEdicoes} qtdEdicoes={qtdEdicoes} salvando={salvando}
        onSalvar={handleSalvar} onCancelar={() => setEdits({})}
        onCopiar={() => setShowPreview(true)}
      />

      {(erro || sucesso) && (
        <div className="px-3 pt-2">
          {erro    && <div className="alert alert-danger py-1 small mb-1">{erro}</div>}
          {sucesso && <div className="alert alert-success py-1 small mb-1">{sucesso}</div>}
        </div>
      )}

      {/* Duas colunas de tabela lado a lado, responsivas */}
      {!loading && (
        <div className="row g-0 px-3 pt-0">
          {/* Coluna esquerda — Metais */}
          <div className="col-12 col-lg-6" style={{ overflow: "hidden" }}>
            {metais.length > 0 && (
              <>
                {/* <p className="fw-semibold text-uppercase small text-muted mb-1">Produtos</p> */}
                <TabelaGenerica
                  columns={colunasCompra}
                  data={dadosGrupo(metais)}
                  emptyMessage="Nenhum produto"
                />
              </>
            )}
          </div>

          {/* Coluna direita — PC + Ferro */}
          <div className="col-12 col-lg-6 mt-3 mt-lg-0" style={{ overflow: "hidden" }}>
            {pc.length > 0 && (
              <>
                <p className="fw-semibold text-uppercase small text-muted mb-1">Placas Eletrônicas</p>
                <TabelaGenerica
                  columns={colunasCompra}
                  data={dadosGrupo(pc)}
                  emptyMessage="Nenhum produto"
                />
              </>
            )}
            {ferro.length > 0 && (
              <div className={pc.length > 0 ? "mt-3" : ""}>
                <p className="fw-semibold text-uppercase small text-muted mb-1">Ferro</p>
                <TabelaGenerica
                  columns={colunasCompra}
                  data={dadosGrupo(ferro)}
                  emptyMessage="Nenhum produto"
                />
                <p className="text-muted small fst-italic text-center mt-1 mb-0">
                  Obs. Ferro somente entrega
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function TabelasPreco() {
  const usuarioComum = isUsuarioComum();
  const [aba, setAba] = useState("venda");

  useEffect(() => { document.title = "CR Metais | Tabelas de Preço"; }, []);

  return (
    <div className="conteudo">
      <Navbar />

      {/* Header padrão */}
      <div className="header d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-end gap-3 ms-4 me-4 mt-4">
        <div className="descricao flex-grow-1">
          <h1 className="display-6 fw-bold">Tabelas de Preço</h1>
          <div className="subtitulo">Gerencie os preços de venda e compra por tabela</div>
        </div>
      </div>

      {/* Card com abas */}
      <div className="mx-4 mt-4 mb-4">
        <div className="card shadow-sm border-0">

          {/* Abas */}
          <div className="card-header bg-white border-bottom p-0">
            <ul className="nav nav-tabs border-0 px-3 pt-2">
              <li className="nav-item">
                <button
                  className={`nav-link fw-semibold${aba === "venda" ? " active" : ""}`}
                  onClick={() => setAba("venda")}
                >
                  Venda
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link fw-semibold${aba === "compra" ? " active" : ""}`}
                  onClick={() => setAba("compra")}
                >
                  Compra
                </button>
              </li>
            </ul>
          </div>

          {/* Conteúdo */}
          <div className="card-body p-0">
            {aba === "venda"  && <AbaVenda  usuarioComum={usuarioComum} />}
            {aba === "compra" && <AbaCompra usuarioComum={usuarioComum} />}
          </div>

        </div>
      </div>
    </div>
  );
}
