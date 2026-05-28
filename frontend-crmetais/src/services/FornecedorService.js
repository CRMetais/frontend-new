import { API_URL } from "./apiClient";

// ================================
// LISTAR FORNECEDORES
// ================================

export async function listarFornecedores() {

    const token = localStorage.getItem("token");

    const res = await fetch(
        `${API_URL}/fornecedores`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!res.ok) {
        throw new Error(
            "Erro ao listar fornecedores"
        );
    }

    return res.json();

}

// ================================
// BUSCAR FORNECEDOR POR ID
// ================================

export async function buscarFornecedorPorId(idFornecedor) {

    const token = localStorage.getItem("token");

    const res = await fetch(
        `${API_URL}/fornecedores/${idFornecedor}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!res.ok) {
        throw new Error(
            "Fornecedor não encontrado"
        );
    }

    return res.json();

}

// ================================
// CADASTRAR FORNECEDOR
// ================================

export async function cadastrarFornecedor(dto) {

    const token = localStorage.getItem("token");

    const res = await fetch(
        `${API_URL}/fornecedores`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(dto),
        }
    );

    if (!res.ok) {
        throw new Error(
            "Erro ao cadastrar fornecedor"
        );
    }

    return res.json();

}

// ================================
// ATUALIZAR FORNECEDOR
// ================================

export async function atualizarFornecedor(
    idFornecedor,
    dto
) {

    const token = localStorage.getItem("token");

    const res = await fetch(
        `${API_URL}/fornecedores/${idFornecedor}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(dto),
        }
    );

    if (!res.ok) {
        throw new Error(
            "Erro ao atualizar fornecedor"
        );
    }

    return res.json();

}

// ================================
// DELETAR FORNECEDOR
// ================================

export async function deletarFornecedor(
    idFornecedor
) {

    const token = localStorage.getItem("token");

    const res = await fetch(
        `${API_URL}/fornecedores/${idFornecedor}`,
        {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!res.ok) {
        throw new Error(
            "Erro ao deletar fornecedor"
        );
    }

}