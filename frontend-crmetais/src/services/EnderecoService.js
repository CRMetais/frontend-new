import { API_URL } from "./apiClient";

// ================================
// CADASTRAR ENDEREÇO
// ================================

export async function cadastrarEndereco(dto) {

    const token = localStorage.getItem("token");

    const res = await fetch(
        `${API_URL}/enderecos`,
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
            "Erro ao cadastrar endereço"
        );
    }

    return res.json();

}

// ================================
// BUSCAR ENDEREÇO
// ================================

export async function buscarEnderecoPorId(id) {

    const token = localStorage.getItem("token");

    const res = await fetch(
        `${API_URL}/enderecos/${id}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!res.ok) {
        throw new Error(
            "Erro ao buscar endereço"
        );
    }

    return res.json();

}

// ================================
// ATUALIZAR ENDEREÇO
// ================================

export async function atualizarEndereco(
    id,
    dto
) {

    const token = localStorage.getItem("token");

    const res = await fetch(
        `${API_URL}/enderecos/${id}`,
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
            "Erro ao atualizar endereço"
        );
    }

    return res.json();

}