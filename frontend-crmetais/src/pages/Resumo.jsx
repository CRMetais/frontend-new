import React, { useEffect, useState, useMemo } from 'react';
import Navbar from '../components/Navbar';
import { InputPesquisa } from '../components/Inputs';
import TabelaGenerica from "../components/TabelaGenerica";
import { Kpi } from '../components/Kpis';
import { api } from '../services/ResumoService';

import "../styles/Resumo.css";

export function Resumo() {

    const [resumo, setResumo] = useState(null);
    const [busca, setBusca] = useState("");
    const [clienteSel, setClienteSel] = useState("VITAL");

    useEffect(() => {
        document.title = "CR Metais | Resumo";
    }, []);

    useEffect(() => {

        api.get("/resumos")
            .then((res) => {
                setResumo(res.data);
            })
            .catch((err) => {
                console.error(err);
            });

    }, []);

    // ================================
    // Mapa de tabelas de preço
    // ================================

    const tabelaMap = useMemo(() => {

        if (!resumo?.tabelasPreco) return {};

        const map = {};

        for (const item of resumo.tabelasPreco) {

            if (!map[item.nomeTabela]) {
                map[item.nomeTabela] = {};
            }

            map[item.nomeTabela][item.nomeProduto] = item.precoProduto;
        }

        return map;

    }, [resumo]);

    // ================================
    // Preços do cliente selecionado
    // ================================

    const precosCliente = useMemo(() => {

        if (!clienteSel) return {};

        const chave = Object.keys(tabelaMap).find(
            (k) => k.toLowerCase() === clienteSel.toLowerCase()
        );

        return chave ? tabelaMap[chave] : {};

    }, [clienteSel, tabelaMap]);

    if (!resumo) {
        return <p>Carregando...</p>;
    }

    // ================================
    // Busca
    // ================================

    const termo = busca.toLowerCase().trim();

    const produtosFiltrados = resumo.produtos.filter((produto) =>
        !termo ||
        produto.nome?.toLowerCase().includes(termo)
    );

    // ================================
    // Colunas da tabela
    // ================================

    const columns = [

        {
            key: "nome",
            label: "Produto",
            sortable: true,
        },

        // AQUI ESTÁ A CORREÇÃO DO PESO
        {
            key: "materialDisponivel",
            label: "Peso (Kg)",
            sortable: true,

            render: (produto) =>
                `${produto.materialDisponivel?.toLocaleString("pt-BR")} Kg`
        },

        {
            key: "valor",
            label: "Valor Unitário (R$)",
            sortable: true,

            render: (produto) => {

                const preco = precosCliente[produto.nome];

                return preco != null
                    ? preco.toLocaleString(
                        "pt-BR",
                        {
                            style: "currency",
                            currency: "BRL",
                        }
                    )
                    : "-";
            }
        },

        {
            key: "valorTotal",
            label: "Valor Total (R$)",
            sortable: true,

            render: (produto) => {

                const preco = precosCliente[produto.nome];

                if (preco == null) return "-";

                const total = produto.materialDisponivel * preco;

                return total.toLocaleString(
                    "pt-BR",
                    {
                        style: "currency",
                        currency: "BRL",
                    }
                );
            }
        },

        {
            key: "destino",
            label: "Destino",
            sortable: true,

            render: () =>
                clienteSel || "-",
        },

    ];

    return (
        <div className='conteudo pb-3'>

            <Navbar />

            <div className="header d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-end gap-3 ms-4 me-4 mt-4">

                <div className="descricao flex-grow-1">

                    <h1 className="display-6 fw-bold">
                        Estoque atual
                    </h1>

                    <div className="subtitulo">
                        Visão geral dos produtos em estoque
                    </div>

                </div>

                <div className="destino-container">

                    <label className="form-label fw-semibold mb-1">
                        Selecione o destino
                    </label>

                    <select
                        className="form-select"
                        value={clienteSel}
                        onChange={(e) => setClienteSel(e.target.value)}
                    >

                        <option value="">Selecione</option>

                        {resumo.clientes.map((cliente) => (

                            <option
                                key={cliente.nome}
                                value={cliente.nome}
                            >
                                {cliente.nome}
                            </option>

                        ))}

                    </select>

                </div>

            </div>

            <div className="container-fluid px-4 mt-4">

                <div className="tabela-e-kpis row gx-3 gy-3">

                    {/* TABELA */}

                    <div className="tabela col-12 col-lg-9 order-2 order-lg-1">

                        <InputPesquisa
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                        />

                        <div className="card shadow-sm border mt-3">

                            <div className="card-body">

                                <TabelaGenerica
                                    columns={columns}
                                    data={produtosFiltrados}
                                    emptyMessage="Nenhum produto encontrado"
                                />

                            </div>

                        </div>

                    </div>

                    {/* KPIs */}

                    <div className="kpis d-flex flex-column col-12 col-lg-3 gap-3 order-1 order-lg-2">

                        <Kpi
                            titulo="Total Aplicado"
                            valor={resumo.totalAplicado.toLocaleString(
                                "pt-BR",
                                {
                                    style: "currency",
                                    currency: "BRL",
                                }
                            )}
                        />

                        <Kpi
                            titulo="Peso Total"
                            valor={`${resumo.pesoTotal.toLocaleString("pt-BR")} Kg`}
                        />

                        <Kpi
                            titulo="Pg Notas (hoje)"
                            valor={resumo.notasHoje.toLocaleString(
                                "pt-BR",
                                {
                                    style: "currency",
                                    currency: "BRL",
                                }
                            )}
                        />

                        <Kpi
                            titulo="Peso Kg (hoje)"
                            valor={`${resumo.pesoHoje.toLocaleString("pt-BR")} Kg`}
                        />

                    </div>

                </div>

            </div>

        </div>
    );
}