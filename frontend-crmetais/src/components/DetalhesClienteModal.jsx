import React, { useEffect, useState } from "react";
import {
  FaBuilding,
  FaPhone,
  FaIdCard,
  FaMapMarkerAlt,
  FaUniversity,
  FaCreditCard,
  FaTag,
  FaUser,
} from "react-icons/fa";
import { buscarClientePorId } from "../services/clienteService";

export default function DetalhesClienteModal({ show, onClose, clienteId }) {
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!show || !clienteId) return;
    carregarDados();
  }, [show, clienteId]);

  async function carregarDados() {
    try {
      setLoading(true);
      const data = await buscarClientePorId(clienteId);
      setCliente(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

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
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content">

          {/* HEADER */}
          <div className="modal-header">
            <h5 className="modal-title d-flex align-items-center gap-2">
              <FaBuilding />
              Detalhes do cliente
            </h5>
            <button className="btn-close" onClick={onClose} />
          </div>

          {/* BODY */}
          <div className="modal-body">
            {loading && (
              <div className="text-center py-5">Carregando...</div>
            )}

            {!loading && cliente && (
              <>
                {/* DADOS GERAIS */}
                <h5 className="mb-3">Dados Gerais</h5>
                <div className="row g-3">
                  <Campo
                    icon={<FaBuilding />}
                    titulo="Razão Social"
                    valor={cliente.razaoSocial}
                  />
                  <Campo
                    icon={<FaIdCard />}
                    titulo="CNPJ"
                    valor={cliente.cnpj}
                  />
                  <Campo
                    icon={<FaPhone />}
                    titulo="Telefone"
                    valor={cliente.telefone}
                  />
                  <Campo
                    icon={<FaUser />}
                    titulo="Responsável"
                    valor={cliente.responsavel?.nome}
                  />
                  <Campo
                    icon={<FaTag />}
                    titulo="Tabela"
                    valor={cliente.tabelaPreco?.nomeTabela}
                  />
                </div>

                <hr />

                {/* ENDEREÇO */}
                <h5 className="mb-3">Endereço</h5>
                <div className="row g-3">
                  <Campo
                    icon={<FaMapMarkerAlt />}
                    titulo="CEP"
                    valor={cliente.endereco?.cep}
                  />
                  <Campo
                    icon={<FaMapMarkerAlt />}
                    titulo="Rua"
                    valor={cliente.endereco?.logradouro}
                  />
                  <Campo
                    icon={<FaMapMarkerAlt />}
                    titulo="Número"
                    valor={cliente.endereco?.numero}
                  />
                  <Campo
                    icon={<FaMapMarkerAlt />}
                    titulo="Cidade"
                    valor={cliente.endereco?.cidade}
                  />
                  <Campo
                    icon={<FaMapMarkerAlt />}
                    titulo="Estado"
                    valor={cliente.endereco?.estado}
                  />
                </div>

                <hr />

                {/* FINANCEIRO */}
                <h5 className="mb-3">Financeiro</h5>
                <div className="row g-3">
                  <Campo
                    icon={<FaCreditCard />}
                    titulo="Pagamento"
                    valor={cliente.tipoPagamento}
                  />
                  <Campo
                    icon={<FaUniversity />}
                    titulo="Banco"
                    valor={cliente.banco}
                  />
                  <Campo
                    icon={<FaUniversity />}
                    titulo="Agência"
                    valor={cliente.agencia}
                  />
                  <Campo
                    icon={<FaUniversity />}
                    titulo="Conta"
                    valor={cliente.conta}
                  />
                  <Campo
                    icon={<FaUniversity />}
                    titulo="PIX"
                    valor={cliente.chavePix}
                  />
                </div>
              </>
            )}
          </div>

          {/* FOOTER */}
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              Fechar
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

function Campo({ icon, titulo, valor }) {
  if (!valor) return null;

  return (
    <div className="col-md-4">
      <div className="border rounded p-3 h-100">
        <div className="d-flex align-items-center gap-2 mb-2 text-secondary">
          {icon}
          <small>{titulo}</small>
        </div>
        <div className="fw-semibold">{valor}</div>
      </div>
    </div>
  );
}
