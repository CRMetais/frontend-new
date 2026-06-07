import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import TabelaGenerica from "../components/TabelaGenerica";
import { InputPesquisaCliente } from "../components/Inputs";
import DetalheClienteModal from "../components/DetalhesClienteModal";
import NovoClienteModal from "../components/NovoClienteModal";
import { listarClientes, deletarCliente } from "../services/ClienteService";
import { FaEdit, FaTrashAlt } from "react-icons/fa";
import "../styles/Cliente.css"

export function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filtroNome, setFiltroNome] = useState("");

  const clientesFiltrados = clientes.filter((cliente) =>
    cliente.razaoSocial?.toLowerCase().includes(filtroNome.toLowerCase())
  );

  const [showModalCliente, setShowModalCliente] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [clienteEditandoId, setClienteEditandoId] = useState(null);

  function abrirNovoCliente() {
    setModoEdicao(false);
    setClienteEditandoId(null);
    setShowModalCliente(true);
  }

  function abrirEdicao(idCliente) {
    setModoEdicao(true);
    setClienteEditandoId(idCliente);
    setShowModalCliente(true);
  }

  // ================================
  // Buscar clientes
  // ================================
  async function carregarClientes() {
    try {
      setLoading(true);
      const data = await listarClientes();
      setClientes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      alert("Erro ao carregar clientes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarClientes();
    document.title = "CR Metais | Clientes";
  }, []);

  // ================================
  // Excluir cliente
  // ================================

  const [showModalExcluir, setShowModalExcluir] = useState(false);
  const [clienteParaExcluir, setClienteParaExcluir] = useState(null);

  function handleExcluir(idCliente) {
    setClienteParaExcluir(idCliente);
    setShowModalExcluir(true);
  }

  async function confirmarExclusaoCliente() {
    try {
      await deletarCliente(clienteParaExcluir);
      carregarClientes();

      setShowModalExcluir(false);
      setClienteParaExcluir(null);
    } catch (error) {
      console.error(error);
      alert("Erro ao excluir cliente");
    }
  }

  function cancelarExclusaoCliente() {
    setShowModalExcluir(false);
    setClienteParaExcluir(null);
  }

  // ================================
  // Colunas da tabela
  // ================================
  const columns = [
    {
      key: "idCliente",
      label: "ID",
      sortable: true,
    },
    {
      key: "razaoSocial",
      label: "Razão Social",
      sortable: true,
    },
    {
      key: "cnpj",
      label: "CNPJ",
      sortable: false,
      render: (cliente) => cliente.cnpj || "-",
    },

    {
      key: "ie",
      label: "Inscrição Estadual",
      sortable: false,
      render: (cliente) => cliente.ie || "-",
    },

    {
      key: "tabela",
      label: "Tabela",
      sortable: true,
      render: (cliente) => cliente.tabelaPreco?.nomeTabela || "-",
    },
    {
      key: "acoes",
      label: "Ações",
      render: (cliente) => (
        <div className="d-flex gap-3">
          <FaEdit
            size={18}
            style={{ cursor: "pointer", color: "#0d6efd" }}
            onClick={(e) => {
              e.stopPropagation();
              abrirEdicao(cliente.idCliente);
            }}
            title="Editar cliente"
          />
          <FaTrashAlt
            size={18}
            style={{ cursor: "pointer", color: "#dc3545" }}
            onClick={(e) => {
              e.stopPropagation();
              handleExcluir(cliente.idCliente);
            }}
            title="Excluir cliente"
          />
        </div>
      ),
    },
  ];

  const [showDetalhes, setShowDetalhes] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);

  function abrirDetalhes(id) {
    setClienteSelecionado(id);
    setShowDetalhes(true);
  }

  return (
    <div className="conteudo">
      <Navbar />

      {/* HEADER */}
      <div className="header d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-end gap-3 ms-4 me-4 mt-4">
        <div className="descricao flex-grow-1">
          <h1 className="display-6 fw-bold">Clientes</h1>
          <div className="subtitulo">
            Veja aqui todos os clientes cadastrados e clique para cadastrar,
            editar ou excluir um cliente existente.
          </div>
        </div>

        <div className="container-botao-cliente d-flex flex-column flex-lg-row gap-2 justify-content-lg-end flex-shrink-0">
          <button className="btn btn-success" onClick={abrirNovoCliente}>
            Novo cliente
          </button>
        </div>
      </div>

      {/* CARD */}
      <div className="tabela container-clientes ms-4 me-4 mt-3 g-3">
        <InputPesquisaCliente
          value={filtroNome}
          onChange={(e) => setFiltroNome(e.target.value)}
        />

        <div className="card shadow-sm border">
          <div className="card-body">
            {loading ? (
              <div className="text-center py-5">Carregando clientes...</div>
            ) : (
              <TabelaGenerica
                columns={columns}
                data={clientesFiltrados}
                onRowClick={(row) => abrirDetalhes(row.idCliente)}
              />
            )}

            <DetalheClienteModal
              show={showDetalhes}
              onClose={() => setShowDetalhes(false)}
              clienteId={clienteSelecionado}
            />

            <NovoClienteModal
              show={showModalCliente}
              onClose={() => setShowModalCliente(false)}
              modoEdicao={modoEdicao}
              clienteId={clienteEditandoId}
              onSuccess={() => {
                carregarClientes();
                setShowModalCliente(false);
              }}
            />
          </div>
        </div>
      </div>

      {showModalExcluir && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Excluir cliente</h5>
                <button
                  className="btn-close"
                  onClick={cancelarExclusaoCliente}
                />
              </div>

              <div className="modal-body">
                <p className="mb-2">
                  Deseja realmente excluir este cliente?
                </p>

                <div className="text-muted small">
                  Esta ação não poderá ser desfeita.
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-outline-secondary"
                  onClick={cancelarExclusaoCliente}
                >
                  Cancelar
                </button>

                <button
                  className="btn btn-danger"
                  onClick={confirmarExclusaoCliente}
                >
                  Excluir cliente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
