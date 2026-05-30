import { useEffect, useState } from "react";
import api from "../services/ApiClient";
import { buscarFornecedorPorId, cadastrarFornecedor, atualizarFornecedor } from "../services/FornecedorService";
import { cadastrarEndereco, atualizarEndereco } from "../services/EnderecoService";
import { buscarContaPagamentoPorFornecedor, cadastrarContaPagamento, atualizarContaPagamento } from "../services/ContaPagamentoService";

const DADOS_INICIAIS = {
  nome: "", documento: "", telefone: "", apelido: "",
  tipoFornecedor: "PESSOA_FISICA",
  cep: "", bairro: "", logradouro: "", numero: "", cidade: "", estado: "",
  tipoPagamento: "",
  chavePix: "", banco: "", agencia: "", conta: "", tipoConta: "",
  pertenceFornecedor: false,
  responsavelNome: "", responsavelDocumento: "",
  idTabelaPreco: "", idUsuario: "",
};

function SectionTitle({ children }) {
  return (
    <div className="d-flex align-items-center gap-2 mb-3 mt-2">
      <span className="fw-semibold small text-uppercase text-secondary">{children}</span>
      <hr className="flex-grow-1 my-0" />
    </div>
  );
}

function Field({ label, children, col = "col-md-6" }) {
  return (
    <div className={`${col} mb-3`}>
      {label && <label className="form-label fw-semibold small text-secondary mb-1">{label}</label>}
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

export default function NovoFornecedorModal({ show, onClose, onSuccess, modoEdicao = false, fornecedorId = null }) {
  const [loading, setLoading] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [tabelas, setTabelas] = useState([]);
  const [dados, setDados] = useState(DADOS_INICIAIS);
  const [idEndereco, setIdEndereco] = useState(null);
  const [idContaPagamento, setIdContaPagamento] = useState(null);

  useEffect(() => {
    if (!show) return;

    setTabelas([]);
    setUsuarios([]);
    setDados(DADOS_INICIAIS);
    setIdEndereco(null);
    setIdContaPagamento(null);

    async function inicializar() {
      try {
        // Carrega tabelas e usuários primeiro
        const [tabelasRes, usuariosRes] = await Promise.all([
          api.get("/tabelas-precos"),
          api.get("/usuarios"),
        ]);

        const tabelasMaisRecentes = filtrarTabelasMaisRecentes(tabelasRes.data);
        setTabelas(tabelasMaisRecentes);
        setUsuarios(usuariosRes.data);

        if (!modoEdicao || !fornecedorId) return;

        // Carrega fornecedor após ter as tabelas disponíveis
        const fornecedor = await buscarFornecedorPorId(fornecedorId);
        setIdEndereco(fornecedor.endereco?.idEndereco ?? null);

        // Resolve a tabela mais recente equivalente à do fornecedor
        const nomeTabelaAtual = fornecedor.tabelaPreco?.nomeTabela;
        const tabelaMaisRecente = tabelasMaisRecentes.find(t => t.nomeTabela === nomeTabelaAtual);
        const idTabelaPrecoFinal = tabelaMaisRecente?.idTabela ?? "";

        // Carrega conta de pagamento se existir
        let contaDados = {};
        let idConta = null;
        try {
          const conta = await buscarContaPagamentoPorFornecedor(fornecedorId);
          idConta = conta.idContaPagamento;
          contaDados = {
            tipoPagamento: conta.pix ? "Pix" : "TED",
            chavePix: conta.chavePix ?? "",
            banco: conta.banco ?? "",
            agencia: conta.agencia ?? "",
            conta: conta.conta ?? "",
            tipoConta: conta.tipoConta ?? "",
            pertenceFornecedor: conta.pertenceFornecedor ?? false,
            responsavelNome: conta.nome ?? "",
            responsavelDocumento: conta.documento ?? "",
          };
        } catch {
          // fornecedor sem conta de pagamento — ok
        }
        setIdContaPagamento(idConta);

        setDados({
          ...DADOS_INICIAIS,
          nome: fornecedor.nome ?? "",
          documento: fornecedor.documento ?? "",
          telefone: fornecedor.telefone ?? "",
          apelido: fornecedor.apelido ?? "",
          tipoFornecedor: fornecedor.tipoFornecedor ?? "PESSOA_FISICA",
          cep: fornecedor.endereco?.cep ?? "",
          logradouro: fornecedor.endereco?.logradouro ?? "",
          numero: fornecedor.endereco?.numero ?? "",
          bairro: fornecedor.endereco?.bairro ?? "",
          cidade: fornecedor.endereco?.cidade ?? "",
          estado: fornecedor.endereco?.estado ?? "",
          idTabelaPreco: idTabelaPrecoFinal,
          idUsuario: fornecedor.responsavel?.idUsuario ?? "",
          ...contaDados,
        });

      } catch (erro) {
        console.error(erro);
        alert("Erro ao carregar dados");
      }
    }

    inicializar();
  }, [show, modoEdicao, fornecedorId]);

  function alterarCampo(e) {
    const { name, value, type, checked } = e.target;
    setDados(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  }

  async function buscarCep(cep) {
    const cepLimpo = cep.replace(/\D/g, "");
    if (cepLimpo.length !== 8) return;
    try {
      setBuscandoCep(true);
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setDados(prev => ({
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

  async function salvar() {
    try {
      setLoading(true);

      const dtoEndereco = {
        estado: dados.estado, cidade: dados.cidade,
        cep: dados.cep.replace(/\D/g, ""),
        logradouro: dados.logradouro, bairro: dados.bairro,
        numero: dados.numero, complemento: null,
      };

      let idEnderecoFinal = idEndereco;
      if (modoEdicao && idEndereco) {
        await atualizarEndereco(idEndereco, dtoEndereco);
      } else {
        const endereco = await cadastrarEndereco(dtoEndereco);
        idEnderecoFinal = endereco.idEndereco;
      }

      const dtoFornecedor = {
        nome: dados.nome,
        documento: dados.documento.replace(/\D/g, ""),
        telefone: dados.telefone.replace(/\D/g, ""),
        apelido: dados.apelido,
        tipoFornecedor: dados.tipoFornecedor,
        idEndereco: idEnderecoFinal,
        idTabelaPreco: dados.idTabelaPreco ? Number(dados.idTabelaPreco) : null,
        idUsuario: dados.idUsuario ? Number(dados.idUsuario) : null,
      };

      let idFornecedorFinal = fornecedorId;
      if (modoEdicao && fornecedorId) {
        await atualizarFornecedor(fornecedorId, dtoFornecedor);
      } else {
        const fornecedor = await cadastrarFornecedor(dtoFornecedor);
        idFornecedorFinal = fornecedor.idFornecedor;
      }

      if (dados.tipoPagamento) {
        const dtoConta = {
          pix: dados.tipoPagamento === "Pix",
          pertenceFornecedor: dados.pertenceFornecedor,
          contaAtiva: true,
          idFornecedor: idFornecedorFinal,
          nome: dados.responsavelNome || null,
          documento: dados.responsavelDocumento || null,
          chavePix: dados.tipoPagamento === "Pix" ? dados.chavePix : null,
          banco: dados.tipoPagamento === "TED" ? dados.banco : null,
          agencia: dados.tipoPagamento === "TED" ? dados.agencia : null,
          conta: dados.tipoPagamento === "TED" ? dados.conta : null,
          tipoConta: dados.tipoPagamento === "TED" ? dados.tipoConta : null,
        };

        if (modoEdicao && idContaPagamento) {
          await atualizarContaPagamento(idContaPagamento, dtoConta);
        } else {
          await cadastrarContaPagamento(dtoConta);
        }
      }

      onSuccess();
      onClose();
      setDados(DADOS_INICIAIS);
    } catch (erro) {
      console.error(erro);
      alert("Erro ao salvar fornecedor");
    } finally {
      setLoading(false);
    }
  }

  const isPix = dados.tipoPagamento === "Pix";
  const isTed = dados.tipoPagamento === "TED";

  if (!show) return null;

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="modal-dialog modal-xl modal-dialog-scrollable" onClick={e => e.stopPropagation()}>
        <div className="modal-content">

          <div className="modal-header">
            <h5 className="modal-title fw-bold">
              {modoEdicao ? "Editar Fornecedor" : "Novo Fornecedor"}
              <span className="badge bg-light text-secondary fw-normal ms-2 fs-6">
                {dados.tipoFornecedor === "PESSOA_FISICA" ? "Pessoa Física" : "Pessoa Jurídica"}
              </span>
            </h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          <div className="modal-body px-4 py-3">

            <SectionTitle>Identificação</SectionTitle>
            <div className="row">
              <Field label="Nome completo / Razão social" col="col-md-5">
                <input className="form-control" name="nome" value={dados.nome} onChange={alterarCampo} placeholder="Nome do fornecedor" />
              </Field>
              <Field label="Apelido" col="col-md-3">
                <input className="form-control" name="apelido" value={dados.apelido} onChange={alterarCampo} placeholder="Nome fantasia" />
              </Field>
              <Field label="Tipo" col="col-md-4">
                <select className="form-select" name="tipoFornecedor" value={dados.tipoFornecedor} onChange={alterarCampo}>
                  <option value="PESSOA_FISICA">Pessoa Física</option>
                  <option value="PESSOA_JURIDICA">Pessoa Jurídica</option>
                </select>
              </Field>
              <Field label="CPF / CNPJ" col="col-md-4">
                <input className="form-control" name="documento" value={dados.documento} onChange={alterarCampo} placeholder="000.000.000-00" />
              </Field>
              <Field label="Telefone" col="col-md-4">
                <input className="form-control" name="telefone" value={dados.telefone} onChange={alterarCampo} placeholder="(00) 00000-0000" />
              </Field>
            </div>

            <SectionTitle>Endereço</SectionTitle>
            <div className="row">
              <Field label="CEP" col="col-md-3">
                <div className="position-relative">
                  <input
                    className="form-control"
                    name="cep"
                    value={dados.cep}
                    onChange={alterarCampo}
                    onBlur={e => buscarCep(e.target.value)}
                    placeholder="00000-000"
                  />
                  {buscandoCep && (
                    <div className="position-absolute top-50 end-0 translate-middle-y me-2">
                      <div className="spinner-border spinner-border-sm text-secondary" role="status" />
                    </div>
                  )}
                </div>
              </Field>
              <Field label="Logradouro" col="col-md-6">
                <input className="form-control" name="logradouro" value={dados.logradouro} onChange={alterarCampo} placeholder="Rua, Av., Travessa..." />
              </Field>
              <Field label="Número" col="col-md-3">
                <input className="form-control" name="numero" value={dados.numero} onChange={alterarCampo} placeholder="Nº" />
              </Field>
              <Field label="Bairro" col="col-md-4">
                <input className="form-control" name="bairro" value={dados.bairro} onChange={alterarCampo} placeholder="Bairro" />
              </Field>
              <Field label="Cidade" col="col-md-5">
                <input className="form-control" name="cidade" value={dados.cidade} onChange={alterarCampo} placeholder="Cidade" />
              </Field>
              <Field label="UF" col="col-md-3">
                <input className="form-control" name="estado" value={dados.estado} onChange={alterarCampo} placeholder="SP" maxLength={2} />
              </Field>
            </div>

            <SectionTitle>Vínculo</SectionTitle>
            <div className="row">
              <Field label="Responsável" col="col-md-6">
                <select className="form-select" name="idUsuario" value={dados.idUsuario} onChange={alterarCampo}>
                  <option value="">Selecione um responsável</option>
                  {usuarios.map(u => <option key={u.idUsuario} value={u.idUsuario}>{u.nome}</option>)}
                </select>
              </Field>
              <Field label="Tabela de preços" col="col-md-6">
                <select className="form-select" name="idTabelaPreco" value={dados.idTabelaPreco} onChange={alterarCampo}>
                  <option value="">Selecione uma tabela</option>
                  {tabelas.map(t => <option key={t.idTabela} value={t.idTabela}>{t.nomeTabela}</option>)}
                </select>
              </Field>
            </div>

            <SectionTitle>Pagamento</SectionTitle>
            <div className="row">
              <Field label="Tipo de pagamento" col="col-md-4">
                <select className="form-select" name="tipoPagamento" value={dados.tipoPagamento} onChange={alterarCampo}>
                  <option value="">Nenhum</option>
                  <option value="Pix">Pix</option>
                  <option value="TED">TED / Conta bancária</option>
                </select>
              </Field>

              {isPix && (
                <Field label="Chave Pix" col="col-md-8">
                  <input className="form-control" name="chavePix" value={dados.chavePix} onChange={alterarCampo} placeholder="CPF, e-mail, telefone ou chave aleatória" />
                </Field>
              )}

              {isTed && (
                <>
                  <Field label="Banco" col="col-md-3">
                    <input className="form-control" name="banco" value={dados.banco} onChange={alterarCampo} placeholder="Ex: 001" />
                  </Field>
                  <Field label="Agência" col="col-md-2">
                    <input className="form-control" name="agencia" value={dados.agencia} onChange={alterarCampo} placeholder="0000" />
                  </Field>
                  <Field label="Conta" col="col-md-3">
                    <input className="form-control" name="conta" value={dados.conta} onChange={alterarCampo} placeholder="00000-0" />
                  </Field>
                  <Field label="Tipo de conta" col="col-md-4">
                    <select className="form-select" name="tipoConta" value={dados.tipoConta} onChange={alterarCampo}>
                      <option value="">Selecione</option>
                      <option value="CORRENTE">Corrente</option>
                      <option value="POUPANCA">Poupança</option>
                    </select>
                  </Field>
                </>
              )}

              {(isPix || isTed) && (
                <div className="col-12 mb-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="pertenceFornecedor"
                      name="pertenceFornecedor"
                      checked={dados.pertenceFornecedor}
                      onChange={alterarCampo}
                    />
                    <label className="form-check-label" htmlFor="pertenceFornecedor">
                      A conta pertence a outra pessoa (responsável pelo recebimento)
                    </label>
                  </div>
                </div>
              )}

              {dados.pertenceFornecedor && (
                <>
                  <Field label="Nome do responsável" col="col-md-6">
                    <input className="form-control" name="responsavelNome" value={dados.responsavelNome} onChange={alterarCampo} />
                  </Field>
                  <Field label="CPF / CNPJ do responsável" col="col-md-6">
                    <input className="form-control" name="responsavelDocumento" value={dados.responsavelDocumento} onChange={alterarCampo} />
                  </Field>
                </>
              )}
            </div>

          </div>

          <div className="modal-footer">
            <button className="btn btn-outline-secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={salvar} disabled={loading} style={{ minWidth: 140 }}>
              {loading
                ? <><span className="spinner-border spinner-border-sm me-2" role="status" />Salvando...</>
                : modoEdicao ? "Salvar alterações" : "Salvar fornecedor"
              }
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
