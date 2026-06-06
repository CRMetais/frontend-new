const formatarMoeda = (valor) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor) || 0);

const formatarColunaTexto = (valor, largura, alinharDireita = false) => {
  const texto = String(valor ?? "");
  const ajustado =
    texto.length > largura ? texto.slice(0, largura) : texto;

  return alinharDireita
    ? ajustado.padStart(largura, " ")
    : ajustado.padEnd(largura, " ");
};

export const copiarTextoParaClipboard = async (texto) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(texto);
    return;
  }

  const areaTexto = document.createElement("textarea");
  areaTexto.value = texto;
  areaTexto.setAttribute("readonly", "");
  areaTexto.style.position = "fixed";
  areaTexto.style.opacity = "0";
  document.body.appendChild(areaTexto);
  areaTexto.select();
  document.execCommand("copy");
  document.body.removeChild(areaTexto);
};

export const construirTextoNotaPagamento = ({
  nomeEntidade,
  tipoEntidade,
  itensBoleta,
}) => {
  const itensValidos = (Array.isArray(itensBoleta) ? itensBoleta : [])
    .map((item) => ({
      nomeProduto: item?.nomeProduto || item?.descricao || "-",
      peso: Number(item?.peso || 0),
      valorUnitario: Number(item?.valorUnitario || 0),
      total: Number(item?.total || 0),
      bags: Number(item?.bags || 0),
    }))
    .filter((item) => item.peso > 0);

  if (itensValidos.length === 0) {
    return "";
  }

  const colunas = {
    produto: 18,
    peso: 10,
    valor: 12,
    total: 12,
    bags: 6,
  };

  const cabecalhoTabela = [
    formatarColunaTexto("Produto", colunas.produto),
    formatarColunaTexto("Peso(Kg)", colunas.peso, true),
    formatarColunaTexto("Valor", colunas.valor, true),
    formatarColunaTexto("Total", colunas.total, true),
    formatarColunaTexto("Bags", colunas.bags, true),
  ].join("  ");

  const linhasItens = itensValidos.map((item) =>
    [
      formatarColunaTexto(item.nomeProduto, colunas.produto),
      formatarColunaTexto(item.peso.toFixed(2), colunas.peso, true),
      formatarColunaTexto(formatarMoeda(item.valorUnitario), colunas.valor, true),
      formatarColunaTexto(formatarMoeda(item.total), colunas.total, true),
      formatarColunaTexto(String(item.bags), colunas.bags, true),
    ].join("  ")
  );

  const divisor = "-".repeat(cabecalhoTabela.length);
  const totais = itensValidos.reduce(
    (acumulado, item) => ({
      peso: acumulado.peso + item.peso,
      total: acumulado.total + item.total,
      bags: acumulado.bags + item.bags,
    }),
    { peso: 0, total: 0, bags: 0 }
  );

  const linhaTotal = [
    formatarColunaTexto("TOTAL", colunas.produto),
    formatarColunaTexto(totais.peso.toFixed(2), colunas.peso, true),
    formatarColunaTexto("", colunas.valor, true),
    formatarColunaTexto(formatarMoeda(totais.total), colunas.total, true),
    formatarColunaTexto(String(totais.bags), colunas.bags, true),
  ].join("  ");

  return [
    "*NOTA DE PAGAMENTO*",
    `*${tipoEntidade || "Entidade"}:* ${nomeEntidade || "-"}`,
    "",
    cabecalhoTabela,
    divisor,
    ...linhasItens,
    divisor,
    linhaTotal,
  ].join("\n");
};