import axios from "axios";
import { jwtDecode } from "jwt-decode";
import api from "./apiClient";
import { API_URL } from "./apiClient";

// ─── Utilitários internos ──────────────────────────────────────────────────────

function lerJsonStorage(chave) {
  const valor = localStorage.getItem(chave);
  if (!valor) return null;
  try {
    return JSON.parse(valor);
  } catch {
    return null;
  }
}

function obterTokenDecodificado() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    return jwtDecode(token);
  } catch {
    return null;
  }
}

function normalizarCargo(valor) {
  if (typeof valor !== "string") return "";
  return valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase();
}

function extrairCargoDeColecao(colecao) {
  if (!Array.isArray(colecao)) return "";
  for (const item of colecao) {
    const valor = typeof item === "string"
      ? item
      : item?.authority ?? item?.role ?? item?.cargo ?? item?.nome;
    const cargo = normalizarCargo(valor);
    if (cargo) return cargo;
  }
  return "";
}

function extrairCargo(origem) {
  if (!origem || typeof origem !== "object") return "";

  const direto = [origem.cargo, origem.role, origem.perfil, origem.tipoUsuario, origem.tipo, origem.authority]
    .map(normalizarCargo)
    .find(Boolean);
  if (direto) return direto;

  for (const colecao of [origem.roles, origem.authorities, origem.perfis]) {
    const cargo = extrairCargoDeColecao(colecao);
    if (cargo) return cargo;
  }

  const pilha = [origem];
  const visitados = new Set();

  while (pilha.length > 0) {
    const atual = pilha.pop();
    if (!atual || typeof atual !== "object" || visitados.has(atual)) continue;
    visitados.add(atual);

    const cargo = [atual.cargo, atual.role, atual.perfil, atual.tipoUsuario, atual.tipo, atual.authority, atual.nomePerfil, atual.descricaoPerfil]
      .map(normalizarCargo)
      .find(Boolean);
    if (cargo) return cargo;

    const cargoColecao = extrairCargoDeColecao(atual.roles)
      || extrairCargoDeColecao(atual.authorities)
      || extrairCargoDeColecao(atual.perfis);
    if (cargoColecao) return cargoColecao;

    for (const valor of Object.values(atual)) {
      if (valor && typeof valor === "object") pilha.push(valor);
    }
  }

  return "";
}

// ─── Interceptors ─────────────────────────────────────────────────────────────

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url ?? "";
    const ehBloqueioAutoExclusao = status === 403 && url.includes("/usuarios/") && error.config?.method === "delete";

    if (status === 401 || (status === 403 && !ehBloqueioAutoExclusao)) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

// ─── Login ────────────────────────────────────────────────────────────────────

export function extrairToken(dados) {
  return dados?.token ?? dados?.accessToken ?? dados?.jwt ?? null;
}

export function extrairIdUsuario(dados) {
  return dados?.idUsuario ?? dados?.id ?? dados?.userId ?? null;
}

export function extrairUsuarioPersistivel(origem) {
  if (!origem || typeof origem !== "object") return null;

  const pilha = [origem];
  const visitados = new Set();

  while (pilha.length > 0) {
    const atual = pilha.pop();
    if (!atual || typeof atual !== "object" || visitados.has(atual)) continue;
    visitados.add(atual);

    const cargo = extrairCargo(atual);
    const id = atual.idUsuario ?? atual.id ?? atual.sub;
    const email = atual.email ?? atual.username ?? atual.login;

    if (cargo || id || email) return atual;

    for (const valor of Object.values(atual)) {
      if (valor && typeof valor === "object") pilha.push(valor);
    }
  }

  return origem;
}

export async function loginUsuario(email, senha) {
  // axios direto (sem interceptor) para que o 401 não redirecione durante o login
  const response = await axios.post(`${API_URL}/usuarios/login`, { email, senha });
  return response.data;
}

export async function persistirUsuario(dados) {
  const usuarioPersistivel = extrairUsuarioPersistivel(dados);
  const idUsuario = extrairIdUsuario(usuarioPersistivel ?? dados);

  if (idUsuario) {
    try {
      const usuarioCompleto = await buscarUsuarioPorId(idUsuario);
      salvarUsuarioLogado(usuarioCompleto);
      return;
    } catch {
      // fallback: usa o que já tem
    }
  }

  salvarUsuarioLogado(usuarioPersistivel ?? dados);
}

// ─── Usuário logado ───────────────────────────────────────────────────────────

export function getUsuarioLogado() {
  return lerJsonStorage("usuario");
}

export function salvarUsuarioLogado(usuario) {
  if (!usuario) {
    localStorage.removeItem("usuario");
    return;
  }
  localStorage.setItem("usuario", JSON.stringify(usuario));
}

export function getUsuarioLogadoId() {
  const decoded = obterTokenDecodificado();
  if (decoded) return Number(decoded.idUsuario ?? decoded.sub ?? decoded.id);
  const usuario = getUsuarioLogado();
  return Number(usuario?.idUsuario ?? usuario?.id ?? null);
}

export function getUsuarioLogadoCargo() {
  const cargoStorage = extrairCargo(getUsuarioLogado());
  if (cargoStorage) return cargoStorage;
  return extrairCargo(obterTokenDecodificado());
}

export function isUsuarioComum() {
  const cargo = getUsuarioLogadoCargo();
  return cargo.includes("COMUM") || cargo.includes("ROLE_COMUM");
}

export function isUsuarioAdministrador() {
  const cargo = getUsuarioLogadoCargo();
  return cargo.includes("ADMIN") || cargo === "ADM";
}

// ─── CRUD de usuários ─────────────────────────────────────────────────────────

export const cadastrarUsuario = async (dadosUsuario) => {
  const response = await api.post("/usuarios", dadosUsuario);
  return response;
};

export async function listarUsuarios() {
  const response = await api.get("/usuarios");
  return response.data;
}

export async function buscarUsuarioPorId(id) {
  const response = await api.get(`/usuarios/${id}`);
  return response.data;
}

export async function excluirUsuario(id) {
  return await api.delete(`/usuarios/${id}`);
}

export async function editarUsuario(id, dados) {
  return await api.put(`/usuarios/${id}`, dados);
}