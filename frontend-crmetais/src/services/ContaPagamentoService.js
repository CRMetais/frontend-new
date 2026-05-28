import { API_URL } from "./apiClient";

// ================================
// BUSCAR CONTA POR FORNECEDOR
// ================================

export async function buscarContaPagamentoPorFornecedor(
    idFornecedor
) {

    const token = localStorage.getItem("token");

    const res = await fetch(
        `${API_URL}/contas-pagamentos/fornecedor/${idFornecedor}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!res.ok) {

        throw new Error(
            "Conta de pagamento não encontrada"
        );

    }

    return res.json();

}

// ================================
// CADASTRAR CONTA PAGAMENTO
// ================================

export async function cadastrarContaPagamento(
    dto
) {

    const token = localStorage.getItem("token");

    const res = await fetch(
        `${API_URL}/contas-pagamentos`,
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/json",

                Authorization:
                    `Bearer ${token}`,
            },

            body: JSON.stringify(dto),
        }
    );

    if (!res.ok) {

        throw new Error(
            "Erro ao cadastrar conta pagamento"
        );

    }

    return res.json();

}

// ================================
// ATUALIZAR CONTA PAGAMENTO
// ================================

export async function atualizarContaPagamento(
    idContaPagamento,
    dto
) {

    const token = localStorage.getItem("token");

    const res = await fetch(
        `${API_URL}/contas-pagamentos/${idContaPagamento}`,
        {
            method: "PUT",

            headers: {
                "Content-Type":
                    "application/json",

                Authorization:
                    `Bearer ${token}`,
            },

            body: JSON.stringify(dto),
        }
    );

    if (!res.ok) {

        throw new Error(
            "Erro ao atualizar conta pagamento"
        );

    }

    return res.json();

}