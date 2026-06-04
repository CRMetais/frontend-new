import { useEffect, useMemo, useState } from "react";

import Navbar from "../components/Navbar";

import { BarChart } from "@mui/x-charts";

import api from "../services/ApiClient";
import { isUsuarioComum } from "../services/UsuarioService";

import "../styles/Dashboard.css"

export function Dashboard() {

    const usuarioComum = isUsuarioComum();

    const [topProdutos, setTopProdutos] = useState([]);
    const [topFornecedores, setTopFornecedores] = useState([]);

    const [pesoTotal, setPesoTotal] = useState(0);
    const [totalVendas, setTotalVendas] = useState(0);
    const [totalCompras, setTotalCompras] = useState(0);

    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState("");

    const [dataInicio, setDataInicio] = useState(() => {
        const hoje = new Date();
        return `${hoje.getFullYear()}-01-01`;
    });

    const [dataFim, setDataFim] = useState(() => {
        return new Date().toISOString().slice(0, 10);
    });

    const rendimentoTotal = useMemo(() => {
        return totalVendas - totalCompras;
    }, [totalVendas, totalCompras]);

    useEffect(() => {
        document.title = "Dashboard";
    }, []);

    const formatarPeso = (valor) => {
        return `${Number(valor).toLocaleString("pt-BR")} Kg`;
    };

    const formatarMoeda = (valor) => {
        return Number(valor).toLocaleString(
            "pt-BR",
            {
                style: "currency",
                currency: "BRL",
            }
        );
    };

    const carregarDashboard = async () => {

        setCarregando(true);
        setErro("");

        try {

            const params = {
                dataInicio,
                dataFim,
            };

            const [
                resProdutos,
                resFornecedores,
                resEstoque,
                resVendas,
                resCompras,
            ] = await Promise.all([
                api.get("/produtos/top-peso-vendido", { params }),
                api.get("/fornecedores/top-rendimento", { params }),
                api.get("/estoque/total-produtos", { params }),
                api.get("/vendas/montante-total", { params }),
                api.get("/compra/montante-total", { params }),
            ]);

            setPesoTotal(resEstoque.data);
            setTotalVendas(resVendas.data);
            setTotalCompras(resCompras.data);

            setTopProdutos(
                (resProdutos.data || []).slice(0, 10)
            );

            setTopFornecedores(
                (resFornecedores.data || []).slice(0, 10)
            );

        } catch (error) {

            console.error(error);

            setErro("Erro ao carregar dashboard");

        } finally {

            setCarregando(false);

        }
    };

    useEffect(() => {
        carregarDashboard();
    }, []);

    if (usuarioComum) {
        return null;
    }

    return (
        <div className="conteudo pb-4">

            <Navbar />

            {/* HEADER */}

            <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-end gap-3 ms-4 me-4 mt-4">

                <div>

                    <h1 className="display-6 fw-bold mb-1">
                        Dashboard
                    </h1>

                    <div className="subtitulo">
                        Indicadores gerais do sistema
                    </div>

                </div>


                {/* FILTROS */}

                <div className="filtros-dashboard d-flex flex-column flex-md-row gap-2 justify-content-lg-end align-items-stretch align-items-lg-end flex-shrink-0 w-lg-auto">

                    <div>
                        <label className="form-label fw-semibold mb-1">
                            Data inicial
                        </label>

                        <input
                            type="date"
                            className="form-control"
                            value={dataInicio}
                            onChange={(e) => setDataInicio(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="form-label fw-semibold mb-1">
                            Data final
                        </label>

                        <input
                            type="date"
                            className="form-control"
                            value={dataFim}
                            onChange={(e) => setDataFim(e.target.value)}
                        />
                    </div>

                    <div className="d-flex align-items-end">
                        <button
                            className="btn btn-dark"
                            onClick={carregarDashboard}
                            disabled={carregando}
                        >
                            {carregando
                                ? "Carregando..."
                                : "Pesquisar"}
                        </button>
                    </div>

                </div>

            </div>

            {/* KPIs */}

            <div className="container-fluid px-4 mt-4">

                <div className="row g-3">

                    <div className="col-12 col-sm-6 col-xl-3">

                        <div className="card shadow-sm border h-100">

                            <div className="card-body">

                                <div className="text-muted mb-2">
                                    Peso Total
                                </div>

                                <h3 className="fw-bold mb-0">
                                    {formatarPeso(pesoTotal)}
                                </h3>

                            </div>

                        </div>

                    </div>

                    <div className="col-12 col-sm-6 col-xl-3">

                        <div className="card shadow-sm border h-100">

                            <div className="card-body">

                                <div className="text-muted mb-2">
                                    Rendimento
                                </div>

                                <h3 className="fw-bold mb-0">
                                    {formatarMoeda(rendimentoTotal)}
                                </h3>

                            </div>

                        </div>

                    </div>

                    <div className="col-12 col-sm-6 col-xl-3">

                        <div className="card shadow-sm border h-100">

                            <div className="card-body">

                                <div className="text-muted mb-2">
                                    Total de vendas
                                </div>

                                <h3 className="fw-bold mb-0">
                                    {formatarMoeda(totalVendas)}
                                </h3>

                            </div>

                        </div>

                    </div>

                    <div className="col-12 col-sm-6 col-xl-3">

                        <div className="card shadow-sm border h-100">

                            <div className="card-body">

                                <div className="text-muted mb-2">
                                    Total de compras
                                </div>

                                <h3 className="fw-bold mb-0">
                                    {formatarMoeda(totalCompras)}
                                </h3>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

            {/* GRÁFICOS */}

            <div className="container-fluid px-4 mt-4">

                {erro && (
                    <div className="alert alert-danger">
                        {erro}
                    </div>
                )}

                <div className="row g-3">

                    <div className="col-12 col-xl-6">

                        <div className="card shadow-sm border">

                            <div className="card-body">

                                <h5 className="fw-bold mb-4">
                                    Top 10 Produtos
                                </h5>

                                <div style={{ width: "100%", overflowX: "auto" }}>

                                    <BarChart
                                        xAxis={[
                                            {
                                                scaleType: "band",
                                                data: topProdutos.map(
                                                    (item) => item.nome
                                                ),
                                            },
                                        ]}
                                        series={[
                                            {
                                                data: topProdutos.map(
                                                    (item) => item.totalPesoVendido
                                                ),
                                                color: "#facc15",
                                            },
                                        ]}
                                        height={350}
                                    />

                                </div>

                            </div>

                        </div>

                    </div>

                    <div className="col-12 col-xl-6">

                        <div className="card shadow-sm border">

                            <div className="card-body">

                                <h5 className="fw-bold mb-4">
                                    Top 10 Fornecedores
                                </h5>

                                <div style={{ width: "100%", overflowX: "auto" }}>

                                    <BarChart
                                        layout="horizontal"
                                        yAxis={[
                                            {
                                                scaleType: "band",
                                                data: topFornecedores.map(
                                                    (item) => item.apelido
                                                ),
                                            },
                                        ]}
                                        series={[
                                            {
                                                data: topFornecedores.map(
                                                    (item) => item.totalRendimento
                                                ),
                                                color: "#60a5fa",
                                            },
                                        ]}
                                        height={350}
                                    />

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
}