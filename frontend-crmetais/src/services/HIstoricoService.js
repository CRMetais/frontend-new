import api from "./ApiClient";

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

// export const baixarHistoricoCsv = async (tipo, dataInicio, dataFim) => {
//   try {

//     // Chama a Lambda via API Gateway
//     const lambdaUrl = import.meta.env.VITE_LAMBDA_URL;
//     const url = `${lambdaUrl}?tipo=${tipo}&dataInicio=${dataInicio}&dataFim=${dataFim}`;

//     const response = await fetch(url, { method: "GET" });

//     if (!response.ok) throw new Error("Erro ao chamar Lambda");

//     const urlDownload = await response.text();

//     return urlDownload;

//   } catch (error) {
//     console.error("Erro ao baixar CSV:", error);
//     throw error;
//   }
// };

export const baixarHistoricoXml = async (tipo, dataInicio, dataFim) => {
  try {
    const lambdaUrl = import.meta.env.VITE_LAMBDA_XML_URL; // nova env var
    const url = `${lambdaUrl}?tipo=${tipo}&dataInicio=${dataInicio}&dataFim=${dataFim}`;

    const response = await fetch(url, { method: "GET" });

    if (!response.ok) throw new Error("Erro ao chamar Lambda");

    const urlDownload = await response.text();
    return urlDownload;

  } catch (error) {
    console.error("Erro ao baixar XML:", error);
    throw error;
  }
};


export async function baixarHistoricoXmlLocal(tipo, dataInicio, dataFim) {

    const response = await fetch(
        `http://localhost:8080/historico/xml?tipo=${tipo}&dataInicio=${dataInicio}&dataFim=${dataFim}`
    );

    const xml = await response.text();

    const blob = new Blob([xml], { type: "application/xml" });

    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "historico.xml";
    a.click();

    window.URL.revokeObjectURL(url);
}