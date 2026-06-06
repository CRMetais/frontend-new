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
    const lambdaUrl = import.meta.env.VITE_LAMBDA_XML_URL;
    const url = `${lambdaUrl}?tipo=${tipo}&dataInicio=${dataInicio}&dataFim=${dataFim}`;

    const responseLambda = await fetch(url, { method: "GET" });
    if (!responseLambda.ok) throw new Error("Erro ao chamar Lambda");

    const presignedUrl = await responseLambda.text();

    const responseXml = await fetch(presignedUrl);
    const xmlBlob = await responseXml.blob();

    const a = document.createElement("a");
    a.href = URL.createObjectURL(xmlBlob);
    a.download = `historico-${tipo}-${dataInicio}-a-${dataFim}.xml`;
    a.target = "_self";
    a.click();
    URL.revokeObjectURL(a.href);

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
    a.download = `historico_${dataInicio.replaceAll("-", "")}_${dataFim.replaceAll("-", "")}.xml`;
    a.click();

    window.URL.revokeObjectURL(url);
}