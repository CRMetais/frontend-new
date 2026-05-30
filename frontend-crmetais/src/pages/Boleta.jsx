import React, { useCallback, useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { FaTrashAlt, FaPlus, FaTimes } from "react-icons/fa";
import api from "../services/apiClient";
import "../styles/Boleta.css";
import Select from "react-select";

let contadorBoleta = 1;

const criarBoletaVazia = () => ({
  id: contadorBoleta++,
  itensBoleta: [],
  clienteSelecionadoId: "",
  classeNota: "RETIRADA",
  tipoNota: "ENTRADA",
  pagamentoConfirmado: false,
});

export function Boleta() {
  const [boletas, setBoletas] = useState([criarBoletaVazia()]);
  const [abaAtiva, setAbaAtiva] = useState(1);

  const [clientes, setClientes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [precosTabela, setPrecosTabela] = useState([]);
  const [tabelaPorFornecedor, setTabelaPorFornecedor] = useState({});

  const [carregando, setCarregando] = useState(false);
  const [salvandoNota, setSalvandoNota] = useState(false);

  const [carregandoCache, setCarregandoCache] = useState(
    () => !localStorage.getItem("boletas_rascunho")
  );


  const boletaAtual = boletas.find((b) => b.id === abaAtiva) || boletas[0];

  const atualizarBoletaAtual = useCallback(
    (atualizacao) => {
      setBoletas((prev) =>
        prev.map((b) => {
          if (b.id !== abaAtiva) return b;
          return typeof atualizacao === "function"
            ? atualizacao(b)
            : { ...b, ...atualizacao };
        })
      );
    },
    [abaAtiva]
  );

  const {
    itensBoleta,
    clienteSelecionadoId,
    classeNota,
    tipoNota,
    pagamentoConfirmado,
  } = boletaAtual;

  const formatarMoeda = (valor) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor || 0);

  // ================================
  // Carregar produtos e preços
  // ================================
  useEffect(() => {
    const buscarDadosIniciais = async () => {
      try {
        const [resProdutos, resPrecos] = await Promise.all([
          api.get("/produtos"),
          api.get("/preco-produto-tabela"),
        ]);
        setProdutos(resProdutos.data?.content || resProdutos.data || []);
        setPrecosTabela(resPrecos.data?.content || resPrecos.data || []);
      } catch (error) {
        console.error("Erro ao carregar produtos/preços", error);
      }
    };
    buscarDadosIniciais();
  }, []);

  // ================================
  // Carregar clientes/fornecedores
  // ================================
  useEffect(() => {
    const buscarEntidades = async () => {
      setCarregando(true);
      const endpoint = tipoNota === "ENTRADA" ? "fornecedores" : "clientes";

      try {
        const resEntidades = await api.get(`/${endpoint}`);
        setClientes(resEntidades.data?.content || resEntidades.data || []);
      } catch (error) {
        console.error("Erro ao carregar entidades", error);
      }

      if (tipoNota === "ENTRADA") {
        try {
          const resTabelas = await api.get("/tabelas-precos/fornecedores");
          const tabelas = resTabelas.data?.content || resTabelas.data || [];
          const mapaTabelas = {};
          tabelas.forEach((item) => {
            const id = item.idFornecedor || item.idCliente || item.id;
            if (id)
              mapaTabelas[id] = (
                item.nomeTabela ||
                item.tabela ||
                ""
              ).toUpperCase();
          });
          setTabelaPorFornecedor(mapaTabelas);
        } catch {
          setTabelaPorFornecedor({});
        }
      } else {
        setTabelaPorFornecedor({});
      }

      setCarregando(false);
      atualizarBoletaAtual({
        clienteSelecionadoId: "",
        pagamentoConfirmado: false,
      });
    };

    buscarEntidades();
  }, [tipoNota]);

  // ================================
  // Atalhos de teclado
  // ================================
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.altKey && event.key.toLowerCase() === "z") {
        event.preventDefault();
        adicionarItem();
      }
      if (event.altKey && event.key.toLowerCase() === "x") {
        event.preventDefault();
        limparBoleta();
      }
      if (event.altKey && event.key.toLowerCase() === "c") {
        event.preventDefault();
        confirmarPagamento();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [abaAtiva, boletas]);

  useEffect(() => {
    document.title = "CR Metais | Boleta";
  });

  // ─── 🔄 CARGA INICIAL DO RASCUNHO (Redis) ─────────────────────────────────
  useEffect(() => {
    const buscarRascunhoRedis = async () => {
      try {
        const res = await api.get("/boletas/rascunho");
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          // Trata os dados de forma defensiva para evitar estouros de UI
          const boletasTratadas = res.data.map(b => ({
            ...b,
            id: Number(b.id),
            itensBoleta: Array.isArray(b.itensBoleta) ? b.itensBoleta : [],
            clienteSelecionadoId: b.clienteSelecionadoId || "",
            classeNota: b.classeNota || "RETIRADA",
            tipoNota: b.tipoNota || "SAÍDA",
            pagamentoConfirmado: !!b.pagamentoConfirmado
          }));

          setBoletas(boletasTratadas);
          setAbaAtiva(boletasTratadas[0].id);

          // Atualiza o sequenciador global para novas abas não colidirem IDs
          const maiorId = Math.max(...boletasTratadas.map(b => b.id));
          contadorBoleta = maiorId + 1;
        }
      } catch (err) {
        console.error("Erro ao resgatar rascunho do Redis", err);
      } finally {
        setCarregandoCache(false); // Libera o esqueleto/carregamento da tela
      }
    };
    buscarRascunhoRedis();
  }, []);

  // ─── 💾 AUTO-SALVAMENTO (localStorage + Redis) ───────────────────────────
  useEffect(() => {
    if (carregandoCache) return;

    // Salva no localStorage de forma síncrona (sobrevive a navegação SPA)
    try {
      localStorage.setItem("boletas_rascunho", JSON.stringify(boletas));
    } catch (e) {
      console.error("Falha ao salvar no localStorage", e);
    }

    // Sincroniza com Redis via debounce (persistência remota)
    const sincronizarComRedis = async () => {
      try {
        await api.post("/boletas/rascunho", boletas);
        console.log("Rascunho sincronizado no Redis automaticamente.");
      } catch (err) {
        console.error("Falha ao salvar rascunho automaticamente", err);
      }
    };

    const delayDebounce = setTimeout(() => {
      sincronizarComRedis();
    }, 100);

    return () => clearTimeout(delayDebounce);
  }, [boletas, carregandoCache]);

  // ─── Carga inicial (Produtos e Tabelas) ───────────────────────────────────
  useEffect(() => {
    const buscar = async () => {
      try {
        const [resProdutos, resPrecos] = await Promise.all([
          api.get("/produtos"),
          api.get("/preco-produto-tabela"),
        ]);
        setProdutos(resProdutos.data?.content ?? resProdutos.data ?? []);
        setPrecosTabela(resPrecos.data?.content ?? resPrecos.data ?? []);
      } catch (err) {
        console.error("Erro ao carregar produtos/preços", err);
      }
    };
    buscar();
  }, []);

  // ─── Carga de clientes/fornecedores ──────────────────────────────────────
  useEffect(() => {
    if (carregandoCache) return; // Bloqueia limpezas acidentais de estado durante o load inicial
    
    const buscarEntidades = async () => {
      setCarregando(true);
      const endpoint = tipoNota === "ENTRADA" ? "fornecedores" : "clientes";
      try {
        const res = await api.get(`/${endpoint}`);
        setClientes(res.data?.content ?? res.data ?? []);
      } catch (err) {
        console.error("Erro ao carregar entidades", err);
        setClientes([]);
      }

      if (tipoNota === "ENTRADA") {
        try {
          const resTabelas = await api.get("/tabelas-precos/fornecedores");
          const tabelas = resTabelas.data?.content ?? resTabelas.data ?? [];
          const mapa = {};
          tabelas.forEach(item => {
            const id = item.idFornecedor ?? item.idCliente ?? item.id;
            if (id) mapa[id] = (item.nomeTabela ?? item.tabela ?? "").toUpperCase();
          });
          setTabelaPorFornecedor(mapa);
        } catch {
          setTabelaPorFornecedor({});
        }
      } else {
        setTabelaPorFornecedor({});
      }

      atualizarBoletaAtual({ clienteSelecionadoId: "", pagamentoConfirmado: false });
      setCarregando(false);
    };

    buscarEntidades();
  }, [tipoNota, carregandoCache]);

  // ================================
  // Gerenciamento de abas
  // ================================
  const adicionarBoleta = () => {
    const nova = criarBoletaVazia();
    setBoletas((prev) => [...prev, nova]);
    setAbaAtiva(nova.id);
  };

  const removerBoleta = (idBoleta) => {
    setBoletas((prev) => {
      if (prev.length <= 1) return prev;
      const novas = prev.filter((b) => b.id !== idBoleta);
      if (abaAtiva === idBoleta) {
        setAbaAtiva(novas[novas.length - 1].id);
      }
      return novas;
    });
  };

  // ================================
  // Ações da boleta ativa
  // ================================
  const adicionarItem = () => {
    atualizarBoletaAtual((b) => ({
      ...b,
      itensBoleta: [
        ...b.itensBoleta,
        {
          idLinha: Date.now(),
          produtoId: "",
          peso: "",
          bags: "",
          valorUnitario: 0,
          total: 0,
        },
      ],
    }));
  };

  const atualizarItem = (idLinha, campo, valor) => {
    atualizarBoletaAtual((b) => ({
      ...b,
      itensBoleta: b.itensBoleta.map((item) => {
        if (item.idLinha !== idLinha) return item;
        const novoItem = { ...item, [campo]: valor };

        if (campo === "produtoId") {
          const precoObj = precosTabela.find(
            (p) =>
              String(p.fkProduto || p.produtoId) === String(valor)
          );
          novoItem.valorUnitario = precoObj
            ? precoObj.precoProduto || precoObj.preco
            : 0;
        }

        novoItem.total =
          Number(novoItem.peso || 0) * Number(novoItem.valorUnitario || 0);
        return novoItem;
      }),
    }));
  };

  const removerItem = (idLinha) => {
    atualizarBoletaAtual((b) => ({
      ...b,
      itensBoleta: b.itensBoleta.filter((i) => i.idLinha !== idLinha),
    }));
  };

  const limparBoleta = () => {
    atualizarBoletaAtual({ itensBoleta: [] });
  };

  const resumo = itensBoleta.reduce(
    (acc, item) => ({
      total: acc.total + Number(item.total || 0),
      peso: acc.peso + Number(item.peso || 0),
      bags: acc.bags + Number(item.bags || 0),
    }),
    { total: 0, peso: 0, bags: 0 }
  );

  // ================================
  // Confirmar pagamento
  // ================================
  const confirmarPagamento = async () => {
    const itensValidos = itensBoleta.filter(
      (i) => i.produtoId && Number(i.peso) > 0
    );

    if (!clienteSelecionadoId)
      return alert("Selecione um cliente/fornecedor.");
    if (itensValidos.length === 0)
      return alert("Adicione produtos com peso válido.");

    setSalvandoNota(true);
    const dataAtual = new Date().toISOString().slice(0, 10);
    const idEntidade = Number(clienteSelecionadoId);

    try {
      if (tipoNota === "ENTRADA") {
        const itensPayload = itensValidos.map((item) => ({
          idProduto: Number(item.produtoId),
          pesoKg: Number(item.peso),
          precoUnitario: Number(item.valorUnitario),
          rendimento: Number(item.total),
        }));

        const resCompra = await api.post("/compra", {
          dataCompra: dataAtual,
          idFornecedor: idEntidade,
          itens: itensPayload,
        });

        const idCompra = resCompra.data.idCompra || resCompra.data.id;
        await api.post("/pagamento-compra", {
          dataPagamento: dataAtual,
          idCompra: Number(idCompra),
          idContaPagamento: 1,
        });
      } else {
        const resVenda = await api.post("/vendas", {
          idCliente: idEntidade,
          datavenda: dataAtual,
        });

        const idVenda = resVenda.data.idVenda || resVenda.data.id;

        for (const item of itensValidos) {
          await api.post("/itens-pedido-venda", {
            fk_venda: Number(idVenda),
            fk_produto: Number(item.produtoId),
            pesoKg: Number(item.peso),
            precoUnitario: Number(item.valorUnitario),
          });
        }
      }

      limparBoleta();
      atualizarBoletaAtual({ pagamentoConfirmado: true });
      if (boletas.length === 1) {
        try { await api.delete("/boletas/rascunho"); } catch {}
      }
    } catch (erro) {
      console.error("Detalhe do erro:", erro.response?.data || erro.message);
      alert("Erro ao confirmar pagamento.");
    } finally {
      setSalvandoNota(false);
    }
  };

  // ================================
  // Gerar nota fiscal
  // ================================
  const gerarNotaFiscal = async () => {
    try {
      if (!clienteSelecionadoId) {
        alert("Selecione um cliente/fornecedor.");
        return;
      }
      if (itensBoleta.length === 0) {
        alert("Adicione itens na boleta.");
        return;
      }

      const payload = {
        idFornecedor: Number(clienteSelecionadoId),
        tipoNota,
        classeNota,
        itens: itensBoleta.map((item) => ({
          produtoId: Number(item.produtoId),
          peso: Number(item.peso),
          valorUnitario: Number(item.valorUnitario),
          total: Number(item.total),
          bags: Number(item.bags),
        })),
      };

      const resJava = await api.post("/nota-fiscal", payload);

      await fetch("http://localhost:5000/gerar-nf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resJava.data),
      });

      alert("NF gerada! Veja o terminal do Python");
    } catch (erro) {
      console.error("Erro ao gerar NF:", erro);
      alert("Erro ao gerar nota fiscal");
    }
  };

  const clienteSelecionado = clientes.find(
    (c) =>
      String(c.id || c.idCliente || c.idFornecedor) === clienteSelecionadoId
  );
  const nomeCliente = clienteSelecionado
    ? clienteSelecionado.nome || clienteSelecionado.razaoSocial
    : "-";
  const nomeTabela = clienteSelecionado
    ? tabelaPorFornecedor[clienteSelecionadoId] || "-"
    : "-";

  return (
    <div className="conteudo">
      <Navbar />

      {/* ================================
          HEADER
      ================================ */}
      <div className="header d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-end gap-3 ms-4 me-4 mt-4">
        <div className="descricao flex-grow-1">
          <h1 className="display-6 fw-bold">Boleta</h1>
          <div className="subtitulo">
            Registre entradas e saídas, confirme pagamentos e gere notas
            fiscais.
          </div>
        </div>
      </div>

      {/* ================================
          ABAS
      ================================ */}
      <div className="ms-4 me-4 mt-3">
        <ul className="nav nav-tabs">
          {boletas.map((b, idx) => (
            <li className="nav-item" key={b.id}>
              <button
                className={`nav-link d-flex align-items-center gap-2 ${
                  b.id === abaAtiva ? "active" : ""
                }`}
                onClick={() => setAbaAtiva(b.id)}
              >
                Boleta {idx + 1}
                {boletas.length > 1 && (
                  <FaTimes
                    size={11}
                    className="text-secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      removerBoleta(b.id);
                    }}
                    title="Excluir boleta"
                  />
                )}
              </button>
            </li>
          ))}
          <li className="nav-item">
            <button
              className="nav-link text-success"
              onClick={adicionarBoleta}
              title="Nova boleta"
            >
              <FaPlus size={13} />
            </button>
          </li>
        </ul>
      </div>

      {/* ================================
          CONTEÚDO
      ================================ */}
      <div className="ms-4 me-4 mt-3 mb-4">
        <div className="row g-3 align-items-start">

          {/* COLUNA PRINCIPAL */}
          <div className="col-12 col-xl-8">
            <div className="card shadow-sm border">
              <div className="card-body">

                {/* Cabeçalho do card */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-3">
                  <h5 className="fw-bold mb-0">Nota de Pagamento</h5>

                  <div className="d-flex flex-wrap gap-2 align-items-center">
                    {carregando ? (
                      <span className="text-muted small">Carregando...</span>
                    ) : (
                      <select
                        className="form-select form-select-sm"
                        style={{ minWidth: "200px" }}
                        value={clienteSelecionadoId}
                        onChange={(e) =>
                          atualizarBoletaAtual({
                            clienteSelecionadoId: e.target.value,
                          })
                        }
                      >
                        <option value="" disabled>
                          Selecione o{" "}
                          {tipoNota === "ENTRADA" ? "Fornecedor" : "Cliente"}
                        </option>
                        {clientes.map((c) => (
                          <option
                            key={c.id || c.idCliente || c.idFornecedor}
                            value={c.id || c.idCliente || c.idFornecedor}
                          >
                            {c.nome || c.razaoSocial}
                          </option>
                        ))}
                      </select>
                    )}

                    <button
                      className="btn btn-success btn-sm"
                      onClick={adicionarItem}
                    >
                      <FaPlus size={12} className="me-1" />
                      Produto
                    </button>

                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={limparBoleta}
                      disabled={itensBoleta.length === 0}
                    >
                      Limpar
                    </button>
                  </div>
                </div>

                <hr className="my-2" />

                {/* Tabela de itens */}
                <div className="tableContainer">
                  <table className="tableCustom table align-middle mb-0">
                    <thead>
                      <tr>
                        <th style={{ width: "40px" }}>#</th>
                        <th>Produto</th>
                        <th style={{ width: "140px" }}>Peso (Kg)</th>
                        <th style={{ width: "110px" }}>Valor Unit.</th>
                        <th style={{ width: "110px" }}>Total</th>
                        <th style={{ width: "130px" }}>Qtd. Bags</th>
                        <th style={{ width: "60px" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {itensBoleta.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="text-center text-muted py-4"
                          >
                            Nenhum produto adicionado.
                          </td>
                        </tr>
                      ) : (
                        itensBoleta.map((item, index) => (
                          <tr key={item.idLinha}>
                            <td className="text-muted">{index + 1}</td>
                            <td>
  <Select
   menuPortalTarget={document.body}
   menuPosition="fixed"
    options={produtos.map((p) => ({
      value: String(p.id || p.idProduto),
      label: p.nome || p.descricao,
    }))}
    value={
      item.produtoId
        ? {
            value: String(item.produtoId),
            label: produtos.find(
              (p) => String(p.id || p.idProduto) === String(item.produtoId)
            )?.nome || "",
          }
        : null
    }
    onChange={(opcao) =>
      atualizarItem(item.idLinha, "produtoId", opcao ? opcao.value : "")
    }
    placeholder="Buscar produto..."
    isClearable
    classNamePrefix="react-select"
  />
</td>
                            <td>
                              <input
                                type="text"
                                className="form-control form-control-sm bg-transparent border-0"
                                placeholder="ex: 120-15"
                                value={item.peso}
                                onChange={(e) =>
                                  atualizarItem(item.idLinha, "peso", e.target.value)
                                }
                                onBlur={(e) => {
                                  try {
                                    const expr = e.target.value.replace(/,/g, ".");
                                    const resultado = Function(`"use strict"; return (${expr})`)();
                                    if (!isNaN(resultado) && isFinite(resultado)) {
                                      atualizarItem(item.idLinha, "peso", Number(resultado.toFixed(2)));
                                    }
                                  } catch {}
                                }}
                              />
                            </td>
                            <td className="text-muted small">
                              {formatarMoeda(item.valorUnitario)}
                            </td>
                            <td className="fw-semibold">
                              {formatarMoeda(item.total)}
                            </td>
                            <td>
                              <input
                                type="number"
                                min="0"
                                step="1"
                                className="form-control form-control-sm bg-transparent border-0"
                                placeholder="0"
                                value={item.bags}
                                onChange={(e) =>
                                  atualizarItem(
                                    item.idLinha,
                                    "bags",
                                    e.target.value
                                  )
                                }
                              />
                            </td>
                            <td>
                              <FaTrashAlt
                                size={15}
                                style={{
                                  cursor: "pointer",
                                  color: "#dc3545",
                                }}
                                onClick={() => removerItem(item.idLinha)}
                                title="Remover item"
                              />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

              </div>
            </div>
          </div>

          {/* COLUNA LATERAL */}
          <div className="col-12 col-xl-4">
            <div className="d-flex flex-column gap-3">

              {/* Card: Informações da Nota */}
              <div className="card shadow-sm border">
                <div className="card-body">
                  <h6 className="fw-bold mb-3">Informações da Nota</h6>
                  <ul className="list-group list-group-flush">
                    <li className="list-group-item px-0 d-flex justify-content-between align-items-center">
                      <span className="text-muted small">Nome</span>
                      <strong className="text-end" style={{ maxWidth: "60%" }}>
                        {nomeCliente}
                      </strong>
                    </li>
                    <li className="list-group-item px-0 d-flex justify-content-between align-items-center">
                      <span className="text-muted small">Tabela</span>
                      <strong>{nomeTabela}</strong>
                    </li>
                    <li className="list-group-item px-0 d-flex justify-content-between align-items-center">
                      <span className="text-muted small">Classe</span>
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() =>
                          atualizarBoletaAtual((b) => ({
                            ...b,
                            classeNota:
                              b.classeNota === "RETIRADA"
                                ? "LOCAL"
                                : "RETIRADA",
                          }))
                        }
                      >
                        {classeNota}
                      </button>
                    </li>
                    <li className="list-group-item px-0 d-flex justify-content-between align-items-center">
                      <span className="text-muted small">Tipo</span>
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() =>
                          atualizarBoletaAtual((b) => ({
                            ...b,
                            tipoNota:
                              b.tipoNota === "SAÍDA" ? "ENTRADA" : "SAÍDA",
                          }))
                        }
                      >
                        {tipoNota}
                      </button>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Card: Resumo + Ações */}
              <div className="card shadow-sm border">
                <div className="card-body">

                  {/* Resumo financeiro */}
                  <div className="text-center mb-3">
                    <p className="text-muted small mb-1">Valor Total</p>
                    <h3 className="fw-bold mb-1">{formatarMoeda(resumo.total)}</h3>
                    <div className="d-flex justify-content-center gap-3 text-muted small">
                      <span>{itensBoleta.length} produto(s)</span>
                      <span>{resumo.bags} bag(s)</span>
                      <span>{resumo.peso.toFixed(2)} Kg</span>
                    </div>
                  </div>

                  <hr className="my-2" />

                  {/* Botões de ação */}
                  <h6 className="fw-bold mb-2">Ações da Nota</h6>
                  <div className="d-flex flex-column gap-2">
                    <button
                      className={`btn btn-sm w-100 ${
                        pagamentoConfirmado ? "btn-success" : "btn-primary"
                      }`}
                      onClick={
                        pagamentoConfirmado
                          ? () =>
                              atualizarBoletaAtual({
                                pagamentoConfirmado: false,
                              })
                          : confirmarPagamento
                      }
                      disabled={salvandoNota}
                    >
                      {salvandoNota
                        ? "Salvando..."
                        : pagamentoConfirmado
                        ? "Pagamento Confirmado ✔"
                        : "Confirmar Pagamento"}
                    </button>

                    <button
                      className="btn btn-outline-primary btn-sm w-100"
                      onClick={gerarNotaFiscal}
                    >
                      Gerar Nota Fiscal
                    </button>

                    <button className="btn btn-outline-secondary btn-sm w-100">
                      Copiar Nota ⧉
                    </button>
                  </div>

                  {/* Hint atalhos */}
                  <div className="mt-3 text-muted" style={{ fontSize: "0.72rem" }}>
                    <div><kbd>Alt+Z</kbd> Adicionar produto</div>
                    <div><kbd>Alt+X</kbd> Limpar boleta</div>
                    <div><kbd>Alt+C</kbd> Confirmar pagamento</div>
                  </div>

                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Boleta;
