import api from "./apiClient";

export const buscarHistorico = async (tipo, pagina = 0, tamanho = 10) => {
  try {
    const response = await api.get("/historico", {
      params: {
        tipo,
        pagina,   // ✅ igual backend
        tamanho   // ✅ igual backend
      }
    });

    return response.data;

  } catch (error) {
    console.error("Erro ao buscar histórico:", error);
    throw error;
  }
};

export const baixarHistoricoCsv = async (tipo, dataInicio, dataFim) => {
  try {

    // Chama a Lambda via API Gateway
    const lambdaUrl = import.meta.env.VITE_LAMBDA_URL;
    const url = `${lambdaUrl}?tipo=${tipo}&dataInicio=${dataInicio}&dataFim=${dataFim}`;

    const response = await fetch(url, { method: "GET" });

    if (!response.ok) throw new Error("Erro ao chamar Lambda");

    const urlDownload = await response.text();

    return urlDownload;

  } catch (error) {
    console.error("Erro ao baixar CSV:", error);
    throw error;
  }
};