import { useEffect, useState } from "react";
import api from "../services/ApiClient";
import { buscarClientePorId, cadastrarCliente, atualizarCliente } from "../services/ClienteService";
import { cadastrarEndereco, atualizarEndereco } from "../services/EnderecoService";

const DADOS_INICIAIS = {
    razaoSocial: "",
    cnpj: "",
    telefone: "",
    cep: "",
    bairro: "",
    logradouro: "",
    numero: "",
    cidade: "",
    estado: "",
    idTabelaPreco: "",
    idUsuario: "",
};

function SectionTitle({ children }) {
    return (
        <div className="d-flex align-items-center gap-2 mb-3 mt-2">
            <span className="fw-semibold small text-uppercase text-secondary">
                {children}
            </span>
            <hr className="flex-grow-1 my-0" />
        </div>
    );
}

function Field({ label, children, col = "col-md-6" }) {
    return (
        <div className={`${col} mb-3`}>
            {label && (
                <label className="form-label fw-semibold small text-secondary mb-1">
                    {label}
                </label>
            )}
            {children}
        </div>
    );
}

function filtrarTabelasMaisRecentes(tabelas) {
    return Object.values(
        tabelas.reduce((acc, tabela) => {
            const atual = acc[tabela.nomeTabela];
            if (!atual || tabela.versao > atual.versao) {
                acc[tabela.nomeTabela] = tabela;
            }
            return acc;
        }, {})
    );
}

export default function NovoClienteModal({
    show,
    onClose,
    onSuccess,
    modoEdicao = false,
    clienteId = null,
}) {
    const [loading, setLoading] = useState(false);
    const [buscandoCep, setBuscandoCep] = useState(false);
    const [usuarios, setUsuarios] = useState([]);
    const [tabelas, setTabelas] = useState([]);
    const [dados, setDados] = useState(DADOS_INICIAIS);
    const [idEndereco, setIdEndereco] = useState(null);

    // ================================
    // Inicializar ao abrir
    // ================================
    useEffect(() => {
        if (!show) return;

        setTabelas([]);
        setUsuarios([]);
        setDados(DADOS_INICIAIS);
        setIdEndereco(null);

        async function inicializar() {
            try {
                const [tabelasRes, usuariosRes] = await Promise.all([
                    api.get("/tabelas-precos"),
                    api.get("/usuarios"),
                ]);

                const tabelasMaisRecentes = filtrarTabelasMaisRecentes(
                    tabelasRes.data
                );
                setTabelas(tabelasMaisRecentes);
                setUsuarios(usuariosRes.data);

                if (!modoEdicao || !clienteId) return;

                const cliente = await buscarClientePorId(clienteId);
                setIdEndereco(cliente.endereco?.idEndereco ?? null);

                const nomeTabelaAtual = cliente.tabelaPreco?.nomeTabela;
                const tabelaMaisRecente = tabelasMaisRecentes.find(
                    (t) => t.nomeTabela === nomeTabelaAtual
                );
                const idTabelaPrecoFinal = tabelaMaisRecente?.idTabela ?? "";

                setDados({
                    ...DADOS_INICIAIS,
                    razaoSocial: cliente.razaoSocial ?? "",
                    cnpj: cliente.cnpj ?? "",
                    telefone: cliente.telefone ?? "",
                    cep: cliente.endereco?.cep ?? "",
                    logradouro: cliente.endereco?.logradouro ?? "",
                    numero: cliente.endereco?.numero ?? "",
                    bairro: cliente.endereco?.bairro ?? "",
                    cidade: cliente.endereco?.cidade ?? "",
                    estado: cliente.endereco?.estado ?? "",
                    idTabelaPreco: idTabelaPrecoFinal,
                    idUsuario: cliente.responsavel?.idUsuario ?? "",
                });
            } catch (erro) {
                console.error(erro);
                alert("Erro ao carregar dados");
            }
        }

        inicializar();
    }, [show, modoEdicao, clienteId]);

    function alterarCampo(e) {
        const { name, value } = e.target;
        setDados((prev) => ({ ...prev, [name]: value }));
    }

    // ================================
    // Buscar CEP
    // ================================
    async function buscarCep(cep) {
        const cepLimpo = cep.replace(/\D/g, "");
        if (cepLimpo.length !== 8) return;
        try {
            setBuscandoCep(true);
            const res = await fetch(
                `https://viacep.com.br/ws/${cepLimpo}/json/`
            );
            const data = await res.json();
            if (!data.erro) {
                setDados((prev) => ({
                    ...prev,
                    bairro: data.bairro,
                    logradouro: data.logradouro,
                    cidade: data.localidade,
                    estado: data.uf,
                }));
            }
        } catch {
            // silently fail
        } finally {
            setBuscandoCep(false);
        }
    }

    // ================================
    // Salvar
    // ================================
    async function salvar() {
        try {
            setLoading(true);

            const dtoEndereco = {
                estado: dados.estado,
                cidade: dados.cidade,
                cep: dados.cep.replace(/\D/g, ""),
                logradouro: dados.logradouro,
                bairro: dados.bairro,
                numero: dados.numero,
                complemento: null,
            };

            let idEnderecoFinal = idEndereco;
            if (modoEdicao && idEndereco) {
                await atualizarEndereco(idEndereco, dtoEndereco);
            } else {
                const endereco = await cadastrarEndereco(dtoEndereco);
                idEnderecoFinal = endereco.idEndereco;
            }

            const dtoCliente = {
                razaoSocial: dados.razaoSocial,
                cnpj: dados.cnpj.replace(/\D/g, ""),
                telContato: dados.telefone.replace(/\D/g, ""),
                idEndereco: idEnderecoFinal,
                idTabelaPreco: dados.idTabelaPreco ? Number(dados.idTabelaPreco) : null,
                responsavel: dados.idUsuario
                    ? { idUsuario: Number(dados.idUsuario) }
                    : null,
            };

            if (modoEdicao && clienteId) {
                await atualizarCliente(clienteId, dtoCliente);
            } else {
                await cadastrarCliente(dtoCliente);
            }

            onSuccess();
            onClose();
            setDados(DADOS_INICIAIS);
        } catch (erro) {
            console.error(erro);
            alert(erro.message || "Erro ao salvar cliente");
        } finally {
            setLoading(false);
        }
    }

    if (!show) return null;

    return (
        <div
            className="modal fade show d-block"
            tabIndex="-1"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            onClick={onClose}
        >
            <div
                className="modal-dialog modal-xl modal-dialog-scrollable"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-content">

                    <div className="modal-header">
                        <h5 className="modal-title fw-bold">
                            {modoEdicao ? "Editar Cliente" : "Novo Cliente"}
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose} />
                    </div>

                    <div className="modal-body px-4 py-3">

                        {/* IDENTIFICAÇÃO */}
                        <SectionTitle>Identificação</SectionTitle>
                        <div className="row">
                            <Field label="Razão Social" col="col-md-8">
                                <input
                                    className="form-control"
                                    name="razaoSocial"
                                    value={dados.razaoSocial}
                                    onChange={alterarCampo}
                                    placeholder="Razão social do cliente"
                                />
                            </Field>
                            <Field label="CNPJ" col="col-md-4">
                                <input
                                    className="form-control"
                                    name="cnpj"
                                    value={dados.cnpj}
                                    onChange={alterarCampo}
                                    placeholder="00.000.000/0000-00"
                                />
                            </Field>
                            <Field label="Telefone" col="col-md-4">
                                <input
                                    className="form-control"
                                    name="telefone"
                                    value={dados.telefone}
                                    onChange={alterarCampo}
                                    placeholder="(00) 00000-0000"
                                />
                            </Field>
                        </div>

                        {/* ENDEREÇO */}
                        <SectionTitle>Endereço</SectionTitle>
                        <div className="row">
                            <Field label="CEP" col="col-md-3">
                                <div className="position-relative">
                                    <input
                                        className="form-control"
                                        name="cep"
                                        value={dados.cep}
                                        onChange={alterarCampo}
                                        onBlur={(e) => buscarCep(e.target.value)}
                                        placeholder="00000-000"
                                    />
                                    {buscandoCep && (
                                        <div className="position-absolute top-50 end-0 translate-middle-y me-2">
                                            <div
                                                className="spinner-border spinner-border-sm text-secondary"
                                                role="status"
                                            />
                                        </div>
                                    )}
                                </div>
                            </Field>
                            <Field label="Logradouro" col="col-md-6">
                                <input
                                    className="form-control"
                                    name="logradouro"
                                    value={dados.logradouro}
                                    onChange={alterarCampo}
                                    placeholder="Rua, Av., Travessa..."
                                />
                            </Field>
                            <Field label="Número" col="col-md-3">
                                <input
                                    className="form-control"
                                    name="numero"
                                    value={dados.numero}
                                    onChange={alterarCampo}
                                    placeholder="Nº"
                                />
                            </Field>
                            <Field label="Bairro" col="col-md-4">
                                <input
                                    className="form-control"
                                    name="bairro"
                                    value={dados.bairro}
                                    onChange={alterarCampo}
                                    placeholder="Bairro"
                                />
                            </Field>
                            <Field label="Cidade" col="col-md-5">
                                <input
                                    className="form-control"
                                    name="cidade"
                                    value={dados.cidade}
                                    onChange={alterarCampo}
                                    placeholder="Cidade"
                                />
                            </Field>
                            <Field label="UF" col="col-md-3">
                                <input
                                    className="form-control"
                                    name="estado"
                                    value={dados.estado}
                                    onChange={alterarCampo}
                                    placeholder="SP"
                                    maxLength={2}
                                />
                            </Field>
                        </div>

                        {/* VÍNCULO */}
                        <SectionTitle>Vínculo</SectionTitle>
                        <div className="row">
                            <Field label="Responsável" col="col-md-6">
                                <select
                                    className="form-select"
                                    name="idUsuario"
                                    value={dados.idUsuario}
                                    onChange={alterarCampo}
                                >
                                    <option value="">Selecione um responsável</option>
                                    {usuarios.map((u) => (
                                        <option key={u.idUsuario} value={u.idUsuario}>
                                            {u.nome}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Tabela de preços" col="col-md-6">
                                <select
                                    className="form-select"
                                    name="idTabelaPreco"
                                    value={dados.idTabelaPreco}
                                    onChange={alterarCampo}
                                >
                                    <option value="">Selecione uma tabela</option>
                                    {tabelas.map((t) => (
                                        <option key={t.idTabela} value={t.idTabela}>
                                            {t.nomeTabela}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                        </div>

                    </div>

                    <div className="modal-footer">
                        <button
                            className="btn btn-outline-secondary"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={salvar}
                            disabled={loading}
                            style={{ minWidth: 140 }}
                        >
                            {loading ? (
                                <>
                                    <span
                                        className="spinner-border spinner-border-sm me-2"
                                        role="status"
                                    />
                                    Salvando...
                                </>
                            ) : modoEdicao ? (
                                "Salvar alterações"
                            ) : (
                                "Salvar cliente"
                            )}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
