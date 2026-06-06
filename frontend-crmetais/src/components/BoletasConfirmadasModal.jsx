import React, { useCallback, useState } from "react";
import {
  construirTextoNotaPagamento,
  copiarTextoParaClipboard,
} from "../utils/boletaClipboard";
import FeedbackModal from "./FeedbackModal";

const formatarDataHora = (valor) => {
  if (!valor) return "-";

  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "-";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(data);
};

const formatarMoeda = (valor) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor) || 0);

export default function BoletasConfirmadasModal({
  show,
  onClose,
  boletas,
}) {
  const [feedbackModal, setFeedbackModal] = useState({
    show: false,
    title: "",
    message: "",
    variant: "info",
  });

  const abrirFeedbackModal = useCallback((message, variant = "info", title = "") => {
    setFeedbackModal({
      show: true,
      title,
      message,
      variant,
    });
  }, []);

  const fecharFeedbackModal = useCallback(() => {
    setFeedbackModal((estadoAtual) => ({
      ...estadoAtual,
      show: false,
    }));
  }, []);

  const copiarNotaHistorico = async (boleta) => {
    const nota = construirTextoNotaPagamento({
      nomeEntidade: boleta?.nomeEntidade,
      tipoEntidade: boleta?.tipoEntidade,
      itensBoleta: boleta?.itensBoleta,
    });

    if (!nota) {
      abrirFeedbackModal(
        "Essa boleta nao possui itens validos para gerar uma nota copiavel.",
        "warning",
        "Sem itens validos"
      );
      return;
    }

    try {
      await copiarTextoParaClipboard(nota);
      abrirFeedbackModal(
        "A nota desta boleta foi copiada para a area de transferencia.",
        "success",
        "Copia concluida"
      );
    } catch (error) {
      console.error("Erro ao copiar nota do historico:", error);
      abrirFeedbackModal(
        "Nao foi possivel copiar a nota desta boleta.",
        "error",
        "Falha ao copiar"
      );
    }
  };

  if (!show) return null;

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-xl modal-dialog-scrollable"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-content">
          <div className="modal-header">
            <div>
              <h5 className="modal-title mb-1">Boletas confirmadas</h5>
              <div className="text-muted small">
                Pagamentos confirmados nas ultimas 24 horas
              </div>
            </div>
            <button className="btn-close" onClick={onClose} />
          </div>

          <div className="modal-body">
            {boletas.length === 0 ? (
              <div className="text-center text-muted py-5">
                Nenhuma boleta confirmada nas ultimas 24 horas.
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {boletas.map((boleta, index) => (
                  <div className="card border shadow-sm" key={boleta.idHistorico}>
                    <div className="card-body d-flex flex-column gap-3">
                      <div className="d-flex flex-column flex-lg-row justify-content-between gap-2">
                        <div>
                          <div className="fw-bold">
                            Boleta confirmada #{boletas.length - index}
                          </div>
                          <div className="text-muted small">
                            {boleta.tipoNota} | {boleta.classeNota} | {formatarDataHora(boleta.confirmadoEm)}
                          </div>
                        </div>
                        <div className="text-lg-end">
                          <div className="fw-semibold">{boleta.nomeEntidade}</div>
                          <div className="text-muted small">
                            {boleta.tipoEntidade}: {boleta.idEntidade || "-"}
                          </div>
                          <button
                            className="btn btn-outline-secondary btn-sm mt-2"
                            onClick={() => copiarNotaHistorico(boleta)}
                            type="button"
                          >
                            Copiar nota
                          </button>
                        </div>
                      </div>

                      <div className="row g-3">
                        <ResumoCampo titulo="Valor total" valor={formatarMoeda(boleta.resumo?.total)} />
                        <ResumoCampo titulo="Peso total" valor={`${Number(boleta.resumo?.peso || 0).toFixed(2)} Kg`} />
                        <ResumoCampo titulo="Bags" valor={String(Number(boleta.resumo?.bags || 0))} />
                        <ResumoCampo titulo="Itens" valor={String(boleta.itensBoleta?.length || 0)} />
                      </div>

                      <div className="table-responsive">
                        <table className="table table-sm align-middle mb-0">
                          <thead>
                            <tr>
                              <th>Produto</th>
                              <th>Peso</th>
                              <th>Valor unit.</th>
                              <th>Total</th>
                              <th>Bags</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(boleta.itensBoleta || []).map((item) => (
                              <tr key={item.idLinha}>
                                <td>{item.nomeProduto || "-"}</td>
                                <td>{Number(item.peso || 0).toFixed(2)} Kg</td>
                                <td>{formatarMoeda(item.valorUnitario)}</td>
                                <td>{formatarMoeda(item.total)}</td>
                                <td>{Number(item.bags || 0)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              Fechar
            </button>
          </div>
        </div>
      </div>

      <FeedbackModal
        show={feedbackModal.show}
        onClose={fecharFeedbackModal}
        title={feedbackModal.title}
        message={feedbackModal.message}
        variant={feedbackModal.variant}
      />
    </div>
  );
}

function ResumoCampo({ titulo, valor }) {
  return (
    <div className="col-6 col-lg-3">
      <div className="border rounded p-3 h-100">
        <div className="text-muted small mb-1">{titulo}</div>
        <div className="fw-semibold">{valor}</div>
      </div>
    </div>
  );
}