import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import TabelaGenerica from "../components/TabelaGenerica";
import ColaboradorModal from "../components/ColaboradorModal";
import { FaEdit, FaTrashAlt } from "react-icons/fa";
import {
  listarUsuarios,
  excluirUsuario,
  getUsuarioLogadoId,
  isUsuarioComum,
} from "../services/UsuarioService";

import "../styles/GestaoDeDados.css";

export function GestaoDeDados() {
  const usuarioComum = isUsuarioComum();

  const [colaboradores, setColaboradores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroNome, setFiltroNome] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [colaboradorEditandoId, setColaboradorEditandoId] = useState(null);

  const colaboradoresFiltrados = colaboradores.filter((c) =>
    c.nome?.toLowerCase().includes(filtroNome.toLowerCase())
  );

  

  // ================================
  // Carregar colaboradores
  // ================================
  async function carregarColaboradores() {
    try {
      setLoading(true);
      const data = await listarUsuarios();
      const formatados = Array.isArray(data)
        ? data.map((u) => ({
          id: u.idUsuario || u.id,
          nome: u.nome,
          email: u.email,
          cargo: u.cargo ?? "—",
        }))
        : [];
      setColaboradores(formatados);
    } catch (error) {
      console.error(error);
      alert("Erro ao carregar colaboradores");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarColaboradores();
    document.title = "CR Metais | Gestão de Dados";
  }, []);

  // ================================
  // Abrir modal
  // ================================
  function abrirNovoColaborador() {
    setModoEdicao(false);
    setColaboradorEditandoId(null);
    setShowModal(true);
  }

  function abrirEdicao(id) {
    setModoEdicao(true);
    setColaboradorEditandoId(id);
    setShowModal(true);
  }

  // ================================
  // Excluir colaborador
  // ================================

  const [showModalExcluir, setShowModalExcluir] = useState(false);
  const [colaboradorParaExcluir, setColaboradorParaExcluir] = useState(null);

  function handleExcluir(id) {

    const idLogado = getUsuarioLogadoId();

    if (id === idLogado) {
      alert("Você não pode excluir sua própria conta.");
      return;
    }

    setColaboradorParaExcluir(id);
    setShowModalExcluir(true);

  }

  async function confirmarExclusaoColaborador() {

    try {

      await excluirUsuario(colaboradorParaExcluir);

      carregarColaboradores();

      setShowModalExcluir(false);
      setColaboradorParaExcluir(null);

    } catch (error) {

      if (error.response?.status === 403) {

        alert("Você não pode excluir sua própria conta.");

      } else {

        console.error(error);
        alert("Erro ao excluir colaborador");

      }

    }

  }

  function cancelarExclusaoColaborador() {

    setShowModalExcluir(false);
    setColaboradorParaExcluir(null);

  }

  // ================================
  // Colunas da tabela
  // ================================
  const columns = [
    {
      key: "id",
      label: "ID",
      sortable: true,
    },
    {
      key: "nome",
      label: "Nome",
      sortable: true,
    },
    {
      key: "email",
      label: "E-mail",
      sortable: true,
    },
    {
      key: "cargo",
      label: "Cargo",
      sortable: true,
      render: (colaborador) => (
        <span
          className={`badge ${colaborador.cargo === "ADMIN" ? "bg-dark" : "bg-secondary"
            }`}
        >
          {colaborador.cargo}
        </span>
      ),
    },
    {
      key: "acoes",
      label: "Ações",
      render: (colaborador) => {
        const ehLogado = colaborador.id === getUsuarioLogadoId();
        return (
          <div className="d-flex gap-3">
            <FaEdit
              size={18}
              style={{ cursor: "pointer", color: "#0d6efd" }}
              onClick={(e) => {
                e.stopPropagation();
                abrirEdicao(colaborador.id);
              }}
              title="Editar colaborador"
            />
            <FaTrashAlt
              size={18}
              style={{
                cursor: ehLogado ? "not-allowed" : "pointer",
                color: ehLogado ? "#adb5bd" : "#dc3545",
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleExcluir(colaborador.id);
              }}
              title={
                ehLogado
                  ? "Você não pode excluir sua própria conta"
                  : "Excluir colaborador"
              }
            />
          </div>
        );
      },
    },
  ];

  if (usuarioComum) return null;

  return (
    <div className="conteudo">
      <Navbar />

      {/* HEADER */}
      <div className="header d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-end gap-3 ms-4 me-4 mt-4">
        <div className="descricao flex-grow-1">
          <h1 className="display-6 fw-bold">Gestão de Dados</h1>
          <div className="subtitulo">
            Veja aqui todos os colaboradores cadastrados e clique para
            cadastrar, editar ou excluir um colaborador existente.
          </div>
        </div>

        <div className="container-botao-gestao-de-dados d-flex flex-column flex-lg-row gap-2 justify-content-lg-end flex-shrink-0">
          <button className="btn btn-success" onClick={abrirNovoColaborador}>
            Novo colaborador
          </button>
        </div>
      </div>

      {/* CARD */}
      <div className="tabela ms-4 me-4 mt-3 g-3">
        <div className="mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="Pesquisar por nome..."
            value={filtroNome}
            onChange={(e) => setFiltroNome(e.target.value)}
          />
        </div>

        <div className="card shadow-sm border">
          <div className="card-body">
            {loading ? (
              <div className="text-center py-5">
                Carregando colaboradores...
              </div>
            ) : (
              <TabelaGenerica
                columns={columns}
                data={colaboradoresFiltrados}
              />
            )}

            <ColaboradorModal
              show={showModal}
              onClose={() => setShowModal(false)}
              modoEdicao={modoEdicao}
              colaboradorId={colaboradorEditandoId}
              onSuccess={() => {
                carregarColaboradores();
                setShowModal(false);
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
                <h5 className="modal-title">
                  Excluir colaborador
                </h5>

                <button
                  className="btn-close"
                  onClick={cancelarExclusaoColaborador}
                />
              </div>

              <div className="modal-body">
                <p className="mb-2">
                  Deseja realmente excluir este colaborador?
                </p>

                <div className="text-muted small">
                  Esta ação não poderá ser desfeita.
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-outline-secondary"
                  onClick={cancelarExclusaoColaborador}
                >
                  Cancelar
                </button>

                <button
                  className="btn btn-danger"
                  onClick={confirmarExclusaoColaborador}
                >
                  Excluir colaborador
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
