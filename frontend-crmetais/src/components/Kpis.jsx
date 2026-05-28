import React from "react";
import "../styles/Kpis.css"

export function Kpi({ titulo, valor }) {
    return (
        <div className="card text-center shadow-sm border h-100 kpi">

            <div className="card-body d-flex flex-column justify-content-center">

                <span className="kpiValor text-secondary fs-5 mb-2">
                    {titulo}
                </span>

                <h3 className="fw-bold mb-0">
                    {valor}
                </h3>

            </div>

        </div>
    );
}