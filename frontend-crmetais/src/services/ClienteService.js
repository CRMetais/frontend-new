import { API_URL } from "./ApiClient";

// Utilitário interno: lança erro com a mensagem real do backend
async function lancarErro(res, mensagemPadrao) {
    let detalhe = mensagemPadrao;
    try {
        const texto = await res.text();
        console.error("Resposta do backend:", texto);
        const corpo = JSON.parse(texto);
        detalhe = corpo.message || corpo.erro || corpo.error || corpo.detail || texto;
    } catch {
        // resposta sem corpo JSON — mantém mensagem padrão
    }
    throw new Error(detalhe);
}

// ================================
// LISTAR CLIENTES
// ================================
export async function listarClientes() {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/clientes`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) await lancarErro(res, "Erro ao listar clientes");
    return res.json();
}

// ================================
// BUSCAR CLIENTE POR ID
// ================================
export async function buscarClientePorId(idCliente) {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/clientes/${idCliente}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) await lancarErro(res, "Cliente não encontrado");
    return res.json();
}

// ================================
// CADASTRAR CLIENTE
// ================================
export async function cadastrarCliente(dto) {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/clientes`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dto),
    });
    if (!res.ok) await lancarErro(res, "Erro ao cadastrar cliente");
    return res.json();
}

// ================================
// ATUALIZAR CLIENTE
// ================================
export async function atualizarCliente(idCliente, dto) {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/clientes/${idCliente}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dto),
    });
    if (!res.ok) await lancarErro(res, "Erro ao atualizar cliente");
    return res.json();
}

// ================================
// DELETAR CLIENTE
// ================================
export async function deletarCliente(idCliente) {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/clientes/${idCliente}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) await lancarErro(res, "Erro ao deletar cliente");
}