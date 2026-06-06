import React, { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from '../components/Navbar';
// import { TabelaHistorico } from "../components/TabelaGenerica";
import TabelaGenerica from "../components/TabelaGenerica";
import { InputPesquisa } from '../components/Inputs';
import { BotaoXml, BotaoAlternarHistorico } from "../components/Buttons";

import { buscarHistorico, baixarHistoricoXmlLocal, baixarHistoricoXml } from "../services/HIstoricoService";
import { isUsuarioComum } from "../services/UsuarioService";

import "../styles/Historico.css"

export function Historico() {

    const PAGE_SIZE = 10;

    const [tableData, setTableData] = useState([]);
    const [tipoHistorico, setTipoHistorico] = useState("Entrada");
    const [loading, setLoading] = useState(false);
    const [pagina, setPagina] = useState(0);
    const [temMais, setTemMais] = useState(true);
    const [busca, setBusca] = useState("");
    const [mostrarModal, setMostrarModal] = useState(false);
    const [dataInicio, setDataInicio] = useState("");
    const [dataFim, setDataFim] = useState("");

    const observer = useRef(null);
    const loadingRef = useRef(false);

    const usuarioComum = isUsuarioComum();
    const mostrarRendimento = !usuarioComum;

    const carregarDados = useCallback(async (paginaAtual) => {

        if (loadingRef.current) return;

        loadingRef.current = true;
        setLoading(true);

        try {

            const tipoApi =
                tipoHistorico === "Entrada"
                    ? "COMPRA"
                    : "VENDA";

            const data = await buscarHistorico(
                tipoApi,
                paginaAtual,
                PAGE_SIZE
            );

            const novosDados = data.content || [];

            setTableData(prev => {

                if (paginaAtual === 0) {
                    return novosDados;
                }

                const idsExistentes =
                    new Set(prev.map(x => x.id));

                const filtrados =
                    novosDados.filter(
                        item => !idsExistentes.has(item.id)
                    );

                return [...prev, ...filtrados];

            });

            setTemMais(
                novosDados.length === PAGE_SIZE
            );

            setPagina(prev =>
                paginaAtual === 0
                    ? 1
                    : prev + 1
            );

        } catch (error) {

            console.error(error);

        } finally {

            loadingRef.current = false;
            setLoading(false);

        }

    }, [tipoHistorico]);

    const handleBaixarXml = async () => {
        try {
            const tipoApi = tipoHistorico === "Entrada" ? "COMPRA" : "VENDA";
            
            // lambda
            const url = await baixarHistoricoXml(tipoApi, dataInicio, dataFim);
            window.open(url, "_blank");

            // local
            // await baixarHistoricoXmlLocal(tipoApi, dataInicio, dataFim);
            
            setMostrarModal(false);
        } catch (error) {
            console.error("Erro ao gerar XML:", error);
            alert("Não foi possível gerar o XML. Tente novamente.");
        }
    };

    const lastElementRef = useCallback(node => {

        if (loadingRef.current) return;

        if (observer.current) {
            observer.current.disconnect();
        }

        observer.current =
            new IntersectionObserver(entries => {

                if (
                    entries[0].isIntersecting &&
                    temMais
                ) {

                    carregarDados(pagina);

                }

            });

        if (node) {
            observer.current.observe(node);
        }

    }, [temMais, pagina, carregarDados]);



    useEffect(() => {

        document.title =
            "CR Metais | Histórico";

        setTableData([]);
        setPagina(0);
        setTemMais(true);

        loadingRef.current = false;

        setTimeout(() => {

            carregarDados(0);

        }, 0);

    }, [tipoHistorico]);

    const termo = busca.toLowerCase().trim();

    const dadosFiltrados = tableData
        .map((item, originalIndex) => ({
            item,
            originalIndex
        }))
        .filter(({ item }) => {

            if (!termo) return true;

            const produtoMatch =
                item.produto?.toLowerCase().includes(termo);

            const parceiroMatch =
                item.parceiro?.toLowerCase().includes(termo);

            return produtoMatch || parceiroMatch;
        });

    const formatarData = (data) => {

    if (!data) return "-";

    const [ano, mes, dia] = data.split("-");

    return `${dia}/${mes}/${ano}`;

};

    const columns = [

        {
            key: "id",
            label: "ID",
        },

        {
            key: "produto",
            label: "Produto",
        },

        {
            key: "peso",
            label: "Peso",

            render: (item) =>
                item.peso
                    ? `${item.peso.toLocaleString("pt-BR")} Kg`
                    : "-",
        },

        {
            key: "preco",
            label: "Valor",

            render: (item) =>
                item.preco?.toLocaleString(
                    "pt-BR",
                    {
                        style: "currency",
                        currency: "BRL",
                    }
                ) || "-",
        },

        {
            key: "total",
            label: "Total",

            render: (item) =>
                item.total?.toLocaleString(
                    "pt-BR",
                    {
                        style: "currency",
                        currency: "BRL",
                    }
                ) || "-",
        },

        ...(mostrarRendimento
            ? [{
                key: "rendimento",
                label: "Rendimento",

                render: (item) =>
                    item.rendimento
                        ? item.rendimento.toLocaleString(
                            "pt-BR",
                            {
                                style: "currency",
                                currency: "BRL",
                            }
                        )
                        : "-",
            }]
            : []),

        {
            key: "tipo",
            label: "Tipo",
        },

        {
            key: "parceiro",
            label: "Parceiro",
        },

        {
            key: "data",
            label: "Data",

            render: (item) =>
                formatarData(item.data),
        },

    ];


    return (
        <div className='conteudo pb-3'>
            <Navbar />

            <div className="header d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-end gap-3 ms-4 me-4 mt-4">
                <div className="descricao flex-grow-1">
                    <h1 className="display-6 fw-bold">
                        Histórico de {tipoHistorico}
                    </h1>

                    <div className="subtitulo">
                        Alterne a visualização clicando em
                        <b>
                            {" "}
                            Alternar para {
                                tipoHistorico === "Entrada"
                                    ? "Saída"
                                    : "Entrada"
                            }
                        </b>
                    </div>
                </div>

                <div className="container-botoes-historico d-flex flex-column flex-lg-row gap-2 justify-content-lg-end flex-shrink-0">
                    <BotaoXml
                        onClick={() => setMostrarModal(true)}
                    />

                    <BotaoAlternarHistorico
                        tipoHistorico={tipoHistorico}
                        onClick={() =>
                            setTipoHistorico(prev =>
                                prev === "Entrada"
                                    ? "Saída"
                                    : "Entrada"
                            )
                        }
                    />

                </div>

            </div>


            <div className="tabela container-historico ms-4 me-4 g-3">

                <InputPesquisa
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                />

                <div className="card shadow-sm border mt-3">

                    <div className="card-body">

                        <TabelaGenerica
                            columns={columns}
                            data={
                                dadosFiltrados.map(
                                    ({ item, originalIndex }) => ({
                                        ...item,
                                        _rowKey:
                                            `${item.id}-${originalIndex}`
                                    })
                                )
                            }
                            lastElementRef={
                                !termo
                                    ? lastElementRef
                                    : undefined
                            }
                        />

                        {loading && (

                            <div className="text-center py-3">

                                {/* Carregando... */}

                            </div>

                        )}

                        {mostrarModal && (
    <div
        className="modal fade show d-block"
        tabIndex="-1"
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        onClick={() => setMostrarModal(false)}
    >
        <div
            className="modal-dialog modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="modal-content">

                <div className="modal-header">
                    <h5 className="modal-title fw-bold">
                        Selecionar período
                    </h5>
                    <button
                        type="button"
                        className="btn-close"
                        onClick={() => setMostrarModal(false)}
                    />
                </div>

                <div className="modal-body px-4 py-3">
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label fw-semibold small text-secondary mb-1">
                                Data inicial
                            </label>
                            <input
                                type="date"
                                className="form-control"
                                value={dataInicio}
                                onChange={(e) => setDataInicio(e.target.value)}
                            />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label fw-semibold small text-secondary mb-1">
                                Data final
                            </label>
                            <input
                                type="date"
                                className="form-control"
                                value={dataFim}
                                onChange={(e) => setDataFim(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button
                        className="btn btn-outline-secondary"
                        onClick={() => setMostrarModal(false)}
                    >
                        Cancelar
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleBaixarXml}
                    >
                        Confirmar
                    </button>
                </div>

            </div>
        </div>
    </div>
)}
                    </div>
                </div>
            </div>
        </div>
    )
}