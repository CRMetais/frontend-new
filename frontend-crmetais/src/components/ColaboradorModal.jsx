import { useEffect, useState } from "react";
import {
  cadastrarUsuario,
  editarUsuario,
  buscarUsuarioPorId,
  getUsuarioLogadoId,
  salvarUsuarioLogado,
} from "../services/usuarioService";

const SENHA_FORTE_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const DADOS_INICIAIS = {
  nome: "",
  email: "",
  cargo: "",
  senha: "",
  confirmarSenha: "",
};

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

export default function ColaboradorModal({
  show,
  onClose,
  onSuccess,
  modoEdicao = false,
  colaboradorId = null,
}) {
  const [loading, setLoading] = useState(false);
  const [dados, setDados] = useState(DADOS_INICIAIS);
  const [erros, setErros] = useState({});

  // ================================
  // Carregar dados ao abrir em edição
  // ================================
  useEffect(() => {
    if (!show) return;

    setDados(DADOS_INICIAIS);
    setErros({});

    if (!modoEdicao || !colaboradorId) return;

    async function carregar() {
      try {
        const usuario = await buscarUsuarioPorId(colaboradorId);
        setDados({
          nome: usuario.nome ?? "",
          email: usuario.email ?? "",
          cargo: usuario.cargo ?? "",
          senha: "",
          confirmarSenha: "",
        });
      } catch (error) {
        console.error(error);
        alert("Erro ao carregar colaborador");
      }
    }

    carregar();
  }, [show, modoEdicao, colaboradorId]);

  // ================================
  // Validação em tempo real
  // ================================
  useEffect(() => {
    const novosErros = {};

    if (dados.nome.length > 0 && dados.nome.trim().length <= 2)
      novosErros.nome = "Nome deve ter pelo menos 3 caracteres";

    if (dados.email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email))
      novosErros.email = "E-mail inválido";

    if (!modoEdicao && dados.senha.length > 0 && !SENHA_FORTE_REGEX.test(dados.senha))
      novosErros.senha =
        "Mín. 8 caracteres, maiúscula, minúscula, número e símbolo";

    if (!modoEdicao && dados.confirmarSenha.length > 0 && dados.senha !== dados.confirmarSenha)
      novosErros.confirmarSenha = "As senhas não coincidem";

    if (dados.cargo.length > 0 && dados.cargo.trim().length === 0)
      novosErros.cargo = "Cargo obrigatório";

    setErros(novosErros);
  }, [dados, modoEdicao]);

  function alterarCampo(e) {
    const { name, value } = e.target;
    setDados((prev) => ({ ...prev, [name]: value }));
  }

  // ================================
  // Validação final
  // ================================
  function validar() {
    const novosErros = {};

    if (dados.nome.trim().length <= 2)
      novosErros.nome = "Nome inválido";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email))
      novosErros.email = "E-mail inválido";

    if (dados.cargo.trim().length === 0)
      novosErros.cargo = "Cargo obrigatório";

    if (!modoEdicao) {
      if (!SENHA_FORTE_REGEX.test(dados.senha))
        novosErros.senha = "Senha inválida";
      if (dados.senha !== dados.confirmarSenha)
        novosErros.confirmarSenha = "As senhas não coincidem";
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  }

  // ================================
  // Salvar
  // ================================
  async function salvar() {
    if (!validar()) return;

    try {
      setLoading(true);
      const idLogado = getUsuarioLogadoId();
      const eOMesmoUsuario = Number(colaboradorId) === idLogado;

      if (modoEdicao) {
        const resposta = await editarUsuario(colaboradorId, {
          nome: dados.nome,
          email: dados.email,
          cargo: dados.cargo,
        });

        if (eOMesmoUsuario && resposta.data?.token) {
          localStorage.setItem("token", resposta.data.token);
        }

        if (eOMesmoUsuario) {
          try {
            const usuarioCompleto = await buscarUsuarioPorId(colaboradorId);
            salvarUsuarioLogado(usuarioCompleto);
          } catch {
            salvarUsuarioLogado({
              idUsuario: colaboradorId,
              nome: dados.nome,
              email: dados.email,
              cargo: dados.cargo,
            });
          }
        }
      } else {
        await cadastrarUsuario({
          nome: dados.nome,
          email: dados.email,
          senha: dados.senha,
          cargo: dados.cargo,
        });
      }

      onSuccess();
      onClose();
      setDados(DADOS_INICIAIS);
    } catch (error) {
      console.error(error);
      alert(
        error.response?.data?.message || "Erro ao salvar colaborador"
      );
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
        className="modal-dialog modal-lg modal-dialog-scrollable"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content">

          <div className="modal-header">
            <h5 className="modal-title fw-bold">
              {modoEdicao ? "Editar Colaborador" : "Novo Colaborador"}
            </h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          <div className="modal-body px-4 py-3">

            <SectionTitle>Identificação</SectionTitle>
            <div className="row">
              <Field label="Nome completo" col="col-md-8">
                <input
                  className={`form-control ${erros.nome ? "is-invalid" : ""}`}
                  name="nome"
                  value={dados.nome}
                  onChange={alterarCampo}
                  placeholder="Nome do colaborador"
                />
                {erros.nome && (
                  <div className="invalid-feedback">{erros.nome}</div>
                )}
              </Field>

              <Field label="Cargo" col="col-md-4">
                <select
                  className={`form-select ${erros.cargo ? "is-invalid" : ""}`}
                  name="cargo"
                  value={dados.cargo}
                  onChange={alterarCampo}
                >
                  <option value="" disabled hidden>
                    Selecione
                  </option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="COMUM">COMUM</option>
                </select>
                {erros.cargo && (
                  <div className="invalid-feedback">{erros.cargo}</div>
                )}
              </Field>

              <Field label="E-mail" col="col-md-12">
                <input
                  className={`form-control ${erros.email ? "is-invalid" : ""}`}
                  name="email"
                  type="email"
                  value={dados.email}
                  onChange={alterarCampo}
                  placeholder="email@exemplo.com"
                />
                {erros.email && (
                  <div className="invalid-feedback">{erros.email}</div>
                )}
              </Field>
            </div>

            {!modoEdicao && (
              <>
                <SectionTitle>Senha</SectionTitle>
                <div className="row">
                  <Field label="Senha" col="col-md-6">
                    <input
                      className={`form-control ${erros.senha ? "is-invalid" : ""}`}
                      name="senha"
                      type="password"
                      value={dados.senha}
                      onChange={alterarCampo}
                      placeholder="••••••••"
                    />
                    {erros.senha && (
                      <div className="invalid-feedback">{erros.senha}</div>
                    )}
                  </Field>

                  <Field label="Confirmar senha" col="col-md-6">
                    <input
                      className={`form-control ${erros.confirmarSenha ? "is-invalid" : ""}`}
                      name="confirmarSenha"
                      type="password"
                      value={dados.confirmarSenha}
                      onChange={alterarCampo}
                      placeholder="••••••••"
                    />
                    {erros.confirmarSenha && (
                      <div className="invalid-feedback">
                        {erros.confirmarSenha}
                      </div>
                    )}
                  </Field>

                  <div className="col-12 mb-2">
                    <small className="text-muted">
                      A senha deve ter no mínimo 8 caracteres, incluindo
                      maiúscula, minúscula, número e símbolo (@$!%*?&).
                    </small>
                  </div>
                </div>
              </>
            )}

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
              style={{ minWidth: 160 }}
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
                "Cadastrar colaborador"
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
