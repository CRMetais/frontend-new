import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import TabelaGenerica from "../components/TabelaGenerica";
import { InputPesquisaFornecedor } from "../components/Inputs";
import DetalheFornecedorModal from "../components/DetalhesFornecedorModal";
import NovoModalFornecedor from "../components/NovoFornecedorModal";
import { listarFornecedores, deletarFornecedor } from "../services/FornecedorService";

import { FaEdit, FaTrashAlt } from "react-icons/fa";

import "../styles/Fornecedores.css"


export function Fornecedores() {

    const [fornecedores, setFornecedores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtroNome, setFiltroNome] = useState("");

    const fornecedoresFiltrados =
        fornecedores.filter((fornecedor) =>
            fornecedor.nome
                ?.toLowerCase()
                .includes(filtroNome.toLowerCase())
        );

    const [showModalFornecedor, setShowModalFornecedor] = useState(false);
    const [modoEdicao, setModoEdicao] = useState(false);
    const [fornecedorEditandoId, setFornecedorEditandoId] = useState(null);

    const [showDetalhes, setShowDetalhes] = useState(false);
    const [fornecedorSelecionado, setFornecedorSelecionado] = useState(null);

    useEffect(() => {
        document.title = "CR Metais | Fornecedores";
    }, []);

    function abrirNovoFornecedor() {
        setModoEdicao(false);
        setFornecedorEditandoId(null);
        setShowModalFornecedor(true);
    }

    function abrirEdicao(idFornecedor) {
        setModoEdicao(true);
        setFornecedorEditandoId(idFornecedor);
        setShowModalFornecedor(true);
    }

    function abrirDetalhes(id) {
        setFornecedorSelecionado(null);      // reseta primeiro para garantir que o useEffect dispare
        setTimeout(() => {
            setFornecedorSelecionado(id);
            setShowDetalhes(true);
        }, 0);
    }

    function fecharDetalhes() {
        setShowDetalhes(false);
        setFornecedorSelecionado(null);
    }

    // ================================
    // Buscar fornecedores
    // ================================

    async function carregarFornecedores() {
        try {

            setLoading(true);

            const data = await listarFornecedores();

            setFornecedores(Array.isArray(data) ? data : []);

        } catch (error) {

            console.error(error);
            alert("Erro ao carregar fornecedores");

        } finally {

            setLoading(false);

        }
    }

    useEffect(() => {
        carregarFornecedores();
    }, []);

    // ================================
    // Excluir fornecedor
    // ================================

    const [showModalExcluir, setShowModalExcluir] = useState(false);
    const [fornecedorParaExcluir, setFornecedorParaExcluir] = useState(null);

    function handleExcluir(idFornecedor) {

        setFornecedorParaExcluir(idFornecedor);
        setShowModalExcluir(true);

    }

    async function confirmarExclusaoFornecedor() {

        try {

            await deletarFornecedor(fornecedorParaExcluir);

            carregarFornecedores();

            setShowModalExcluir(false);
            setFornecedorParaExcluir(null);

        } catch (error) {

            console.error(error);
            alert("Erro ao excluir fornecedor");

        }

    }

    function cancelarExclusaoFornecedor() {

        setShowModalExcluir(false);
        setFornecedorParaExcluir(null);

    }

    // ================================
    // Colunas da tabela
    // ================================

    const columns = [

        {
            key: "idFornecedor",
            label: "ID",
            sortable: true,
        },

        {
            key: "nome",
            label: "Nome",
            sortable: true,
        },

        {
            key: "responsavel",
            label: "Responsável",
            sortable: true,
            render: (fornecedor) => fornecedor.responsavel?.nome || "-",
        },

        {
            key: "tabela",
            label: "Tabela",
            sortable: true,
            render: (fornecedor) => fornecedor.tabelaPreco?.nomeTabela || "-",
        },

        {
            key: "acoes",
            label: "Ações",
            render: (fornecedor) => (
                <div className="d-flex gap-3">

                    <FaEdit
                        size={18}
                        style={{ cursor: "pointer", color: "#0d6efd" }}
                        onClick={(e) => {
                            e.stopPropagation();
                            abrirEdicao(fornecedor.idFornecedor);
                        }}
                    />

                    <FaTrashAlt
                        size={18}
                        style={{ cursor: "pointer", color: "#dc3545" }}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleExcluir(fornecedor.idFornecedor);
                        }}
                    />

                </div>
            ),
        },

    ];

    return (
        <div className="conteudo">

            <Navbar />

            {/* HEADER */}
            <div className="header d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-end gap-3 ms-4 me-4 mt-4">
                <div className="descricao flex-grow-1">
                    <h1 className="display-6 fw-bold">
                        Fornecedores
                    </h1>
                    <div className="subtitulo">
                        Veja aqui todos os fornecedores cadastrados e clique para cadastrar, editar ou excluir um fornecedor existente.
                    </div>
                </div>

                <div className="container-botoes-historico d-flex flex-column flex-lg-row gap-2 justify-content-lg-end flex-shrink-0">
                    <button
                        className="btn btn-success"
                        onClick={abrirNovoFornecedor}
                    >
                        Novo fornecedor
                    </button>
                </div>
            </div>

            {/* CARD */}
            <div className="tabela container-fornecedores ms-4 me-4 g-3">

                <InputPesquisaFornecedor
                    value={filtroNome}
                    onChange={(e) => setFiltroNome(e.target.value)}
                />

                <div className="card shadow-sm border">
                    <div className="card-body">

                        {loading ? (
                            <div className="text-center py-5">
                                Carregando fornecedores...
                            </div>
                        ) : (
                            <TabelaGenerica
                                columns={columns}
                                data={fornecedoresFiltrados}
                                onRowClick={(row) => abrirDetalhes(row.idFornecedor)}
                            />
                        )}

                        <DetalheFornecedorModal
                            show={showDetalhes}
                            onClose={fecharDetalhes}
                            fornecedorId={fornecedorSelecionado}
                        />

                        <NovoModalFornecedor
                            show={showModalFornecedor}
                            onClose={() => setShowModalFornecedor(false)}
                            modoEdicao={modoEdicao}
                            fornecedorId={fornecedorEditandoId}
                            onSuccess={() => {
                                carregarFornecedores();
                                setShowModalFornecedor(false);
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
                                    Excluir fornecedor
                                </h5>

                                <button
                                    className="btn-close"
                                    onClick={cancelarExclusaoFornecedor}
                                />
                            </div>

                            <div className="modal-body">
                                <p className="mb-2">
                                    Deseja realmente excluir este fornecedor?
                                </p>

                                <div className="text-muted small">
                                    Esta ação não poderá ser desfeita.
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button
                                    className="btn btn-outline-secondary"
                                    onClick={cancelarExclusaoFornecedor}
                                >
                                    Cancelar
                                </button>

                                <button
                                    className="btn btn-danger"
                                    onClick={confirmarExclusaoFornecedor}
                                >
                                    Excluir fornecedor
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}