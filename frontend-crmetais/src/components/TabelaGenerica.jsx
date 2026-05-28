import React, { useState, useMemo } from "react";
import styles from "../styles/Tables.module.css";

export default function TabelaGenerica({
  columns = [],
  data = [],
  emptyMessage = "Nenhum registro encontrado",
  lastElementRef,
  onRowClick,
}) {

  const [ordenacao, setOrdenacao] = useState({
    campo: null,
    direcao: "asc",
  });

  function ordenarPor(campo) {

    setOrdenacao((prev) => ({

      campo,

      direcao:
        prev.campo === campo &&
          prev.direcao === "asc"
          ? "desc"
          : "asc",

    }));

  }

  function seta(campo) {

    if (ordenacao.campo !== campo) {
      return "↕";
    }

    return ordenacao.direcao === "asc"
      ? "↑"
      : "↓";

  }

  const dadosOrdenados = useMemo(() => {

    if (!ordenacao.campo) {
      return data;
    }

    return [...data].sort((a, b) => {

      let valorA =
        a[ordenacao.campo];

      let valorB =
        b[ordenacao.campo];

      if (
        typeof valorA === "string"
      ) {

        valorA =
          valorA.toLowerCase();

      }

      if (
        typeof valorB === "string"
      ) {

        valorB =
          valorB.toLowerCase();

      }

      valorA ??= "";
      valorB ??= "";

      if (valorA < valorB) {

        return ordenacao.direcao === "asc"
          ? -1
          : 1;

      }

      if (valorA > valorB) {

        return ordenacao.direcao === "asc"
          ? 1
          : -1;

      }

      return 0;

    });

  }, [data, ordenacao]);

  return (

    <div
      className={`table-responsive ${styles.tableContainer}`}
    >

      <table
        className={`table table-hover align-middle ${styles.tableCustom}`}
      >

        <thead>

          <tr>

            {columns.map((column) => (

              <th
                key={column.key}
                onClick={() =>
                  column.sortable &&
                  ordenarPor(column.key)
                }
                style={{
                  cursor:
                    column.sortable
                      ? "pointer"
                      : "default",
                  userSelect: "none",
                }}
              >

                {column.label}

                {column.sortable &&
                  ` ${seta(column.key)}`}

              </th>

            ))}

          </tr>

        </thead>

        <tbody>

          {dadosOrdenados.length === 0 ? (

            <tr>

              <td
                colSpan={columns.length}
                className="text-center py-4"
              >

                {emptyMessage}

              </td>

            </tr>

          ) : (

            dadosOrdenados.map(
              (row, index) => {

                const isLast =
                  index ===
                  dadosOrdenados.length - 1;

                return (

                  <tr
                    key={
                      row._rowKey ||
                      row.id ||
                      row.idFornecedor ||
                      index
                    }
                    ref={
                      isLast &&
                        lastElementRef
                        ? lastElementRef
                        : null
                    }
                    onClick={() =>
                      onRowClick?.(row)
                    }
                    style={{
                      cursor: onRowClick
                        ? "pointer"
                        : "default"
                    }}
                  >

                    {columns.map(
                      (column) => (

                        <td
                          key={
                            column.key
                          }
                        >

                          {column.render
                            ? column.render(
                              row
                            )
                            : row[
                            column.key
                            ] ?? "-"}

                        </td>

                      )
                    )}

                  </tr>

                );

              }
            )

          )}

        </tbody>

      </table>

    </div>

  );

}