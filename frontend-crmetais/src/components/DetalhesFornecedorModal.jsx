import React, { useEffect, useState } from "react";
import {
    FaTimes,
    FaBuilding,
    FaPhone,
    FaUser,
    FaIdCard,
    FaMapMarkerAlt,
    FaUniversity,
    FaCreditCard,
    FaTag
} from "react-icons/fa";

import {
    buscarFornecedorPorId
} from "../services/FornecedorService";

import {
    buscarContaPagamentoPorFornecedor
} from "../services/ContaPagamentoService";

export default function DetalheFornecedorModal({
    show,
    onClose,
    fornecedorId
}) {

    const [fornecedor, setFornecedor] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {

        if (!show || !fornecedorId) return;

        carregarDados();

    }, [show, fornecedorId]);

    async function carregarDados() {

        try {

            setLoading(true);

            const [
                fornecedorData,
                contaData
            ] = await Promise.all([

                buscarFornecedorPorId(
                    fornecedorId
                ),

                buscarContaPagamentoPorFornecedor(
                    fornecedorId
                ).catch(() => null)

            ]);

            setFornecedor({
                ...fornecedorData,
                ...contaData
            });

        } catch (error) {

            console.error(error);

        } finally {

            setLoading(false);

        }

    }

    if (!show) return null;

    return (

        <>
            <div
                className="modal fade show d-block"
                tabIndex="-1"
                style={{
                    background:
                        "rgba(0,0,0,0.5)"
                }}
            >

                <div className="modal-dialog modal-xl modal-dialog-scrollable">

                    <div className="modal-content">

                        {/* HEADER */}

                        <div className="modal-header">

                            <h5
                                className="modal-title d-flex align-items-center gap-2"
                            >

                                <FaBuilding />

                                Detalhes do fornecedor

                            </h5>

                            <button
                                className="btn-close"
                                onClick={onClose}
                            />

                        </div>

                        {/* BODY */}

                        <div className="modal-body">

                            {loading && (

                                <div
                                    className="text-center py-5"
                                >
                                    Carregando...
                                </div>

                            )}

                            {!loading && fornecedor && (

                                <>

                                    {/* DADOS GERAIS */}

                                    <h5 className="mb-3">

                                        Dados Gerais

                                    </h5>

                                    <div className="row g-3">

                                        <Campo
                                            icon={<FaBuilding />}
                                            titulo="Nome"
                                            valor={fornecedor.nome}
                                        />

                                        <Campo
                                            icon={<FaIdCard />}
                                            titulo="Documento"
                                            valor={fornecedor.documento}
                                        />

                                        <Campo
                                            icon={<FaPhone />}
                                            titulo="Telefone"
                                            valor={fornecedor.telefone}
                                        />

                                        <Campo
                                            icon={<FaUser />}
                                            titulo="Responsável"
                                            valor={
                                                fornecedor
                                                    .responsavel
                                                    ?.nome
                                            }
                                        />

                                        <Campo
                                            icon={<FaTag />}
                                            titulo="Tabela"
                                            valor={
                                                fornecedor
                                                    .tabelaPreco
                                                    ?.nomeTabela
                                            }
                                        />

                                    </div>

                                    <hr />

                                    {/* ENDEREÇO */}

                                    <h5 className="mb-3">

                                        Endereço

                                    </h5>

                                    <div className="row g-3">

                                        <Campo
                                            icon={<FaMapMarkerAlt />}
                                            titulo="CEP"
                                            valor={
                                                fornecedor
                                                    .endereco
                                                    ?.cep
                                            }
                                        />

                                        <Campo
                                            icon={<FaMapMarkerAlt />}
                                            titulo="Rua"
                                            valor={
                                                fornecedor
                                                    .endereco
                                                    ?.logradouro
                                            }
                                        />

                                        <Campo
                                            icon={<FaMapMarkerAlt />}
                                            titulo="Número"
                                            valor={
                                                fornecedor
                                                    .endereco
                                                    ?.numero
                                            }
                                        />

                                        <Campo
                                            icon={<FaMapMarkerAlt />}
                                            titulo="Cidade"
                                            valor={
                                                fornecedor
                                                    .endereco
                                                    ?.cidade
                                            }
                                        />

                                        <Campo
                                            icon={<FaMapMarkerAlt />}
                                            titulo="Estado"
                                            valor={
                                                fornecedor
                                                    .endereco
                                                    ?.estado
                                            }
                                        />

                                    </div>

                                    <hr />

                                    {/* FINANCEIRO */}

                                    <h5 className="mb-3">

                                        Financeiro

                                    </h5>

                                    <div className="row g-3">

                                        <Campo
                                            icon={
                                                <FaCreditCard />
                                            }
                                            titulo="Pagamento"
                                            valor={
                                                fornecedor
                                                    .tipoPagamento
                                            }
                                        />

                                        <Campo
                                            icon={
                                                <FaUniversity />
                                            }
                                            titulo="Banco"
                                            valor={
                                                fornecedor
                                                    .banco
                                            }
                                        />

                                        <Campo
                                            icon={
                                                <FaUniversity />
                                            }
                                            titulo="Agência"
                                            valor={
                                                fornecedor
                                                    .agencia
                                            }
                                        />

                                        <Campo
                                            icon={
                                                <FaUniversity />
                                            }
                                            titulo="Conta"
                                            valor={
                                                fornecedor
                                                    .conta
                                            }
                                        />

                                        <Campo
                                            icon={
                                                <FaUniversity />
                                            }
                                            titulo="PIX"
                                            valor={
                                                fornecedor
                                                    .chavePix
                                            }
                                        />

                                    </div>

                                </>

                            )}

                        </div>

                        {/* FOOTER */}

                        <div className="modal-footer">

                            <button
                                className="btn btn-secondary"
                                onClick={onClose}
                            >

                                Fechar

                            </button>

                        </div>

                    </div>

                </div>

            </div>
        </>

    );

}

function Campo({
    icon,
    titulo,
    valor
}) {

    if (!valor) return null;

    return (

        <div className="col-md-4">

            <div
                className="
                    border
                    rounded
                    p-3
                    h-100
                "
            >

                <div
                    className="
                        d-flex
                        align-items-center
                        gap-2
                        mb-2
                        text-secondary
                    "
                >

                    {icon}

                    <small>

                        {titulo}

                    </small>

                </div>

                <div
                    className="fw-semibold"
                >

                    {valor}

                </div>

            </div>

        </div>

    );

}