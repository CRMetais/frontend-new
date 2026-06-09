import api from "./ApiClient";

export const buscarHistorico = async (tipo, pagina = 0, tamanho = 10) => {
  try {
    const response = await api.get("/historico", {
      params: {
        tipo,
        pagina,
        tamanho
      }
    });

    return response.data;

  } catch (error) {
    console.error("Erro ao buscar histórico:", error);
    throw error;
  }
};

// 🔥 LAMBDA
export const baixarHistoricoXlsx = async (tipo, dataInicio, dataFim) => {
  try {
    const lambdaUrl = import.meta.env.VITE_LAMBDA_XLSX_URL;
    const url = `${lambdaUrl}?tipo=${tipo}&dataInicio=${dataInicio}&dataFim=${dataFim}`;

    const responseLambda = await fetch(url, { method: "GET" });
    if (!responseLambda.ok) throw new Error("Erro ao chamar Lambda");

    const presignedUrl = await responseLambda.text();
    window.location.href = presignedUrl;

  } catch (error) {
    console.error("Erro ao baixar XLSX:", error);
    throw error;
  }
};

// 💻 LOCAL
export async function baixarHistoricoXlsxLocal(tipo, dataInicio, dataFim) {
  const response = await api.get("/historico/xlsx", {
    params: { tipo, dataInicio, dataFim },
    responseType: "blob"
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const a = document.createElement("a");
  a.href = url;
  a.download = `historico_${dataInicio.replaceAll("-", "")}_${dataFim.replaceAll("-", "")}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}