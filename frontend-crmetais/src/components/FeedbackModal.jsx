import React from "react";
import "../styles/FeedbackModal.css";

const CONFIGURACAO_VARIANTE = {
  success: {
    badge: "Confirmado",
    tituloPadrao: "Operacao concluida",
    classe: "feedbackModal--success",
  },
  error: {
    badge: "Erro",
    tituloPadrao: "Algo deu errado",
    classe: "feedbackModal--error",
  },
  warning: {
    badge: "Atencao",
    tituloPadrao: "Revise os dados",
    classe: "feedbackModal--warning",
  },
  info: {
    badge: "Aviso",
    tituloPadrao: "Informacao",
    classe: "feedbackModal--info",
  },
};

export default function FeedbackModal({
  show,
  onClose,
  title,
  message,
  variant = "info",
}) {
  if (!show) return null;

  const configuracao =
    CONFIGURACAO_VARIANTE[variant] || CONFIGURACAO_VARIANTE.info;

  return (
    <div
      className="modal fade show d-block feedbackModalBackdrop"
      tabIndex="-1"
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-dialog-centered"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`modal-content feedbackModal ${configuracao.classe}`}>
          <div className="modal-body p-0">
            <div className="feedbackModal__hero">
              <span className="feedbackModal__badge">{configuracao.badge}</span>
              <button
                type="button"
                className="btn-close feedbackModal__close"
                onClick={onClose}
                aria-label="Fechar"
              />
              <h5 className="feedbackModal__title">
                {title || configuracao.tituloPadrao}
              </h5>
              <p className="feedbackModal__message mb-0">{message}</p>
            </div>

            <div className="feedbackModal__footer">
              <button className="btn btn-dark px-4" onClick={onClose} type="button">
                Entendi
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}