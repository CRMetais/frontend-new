import React from 'react';
import "../styles/Buttons.css"
import { useNavigate } from 'react-router-dom';

export function BotaoLogin({ onClick }) {

    return (
        <button type='submit' className='btn btn-lg btn-primary w-100 shadow-sm' onClick={onClick}>Entrar</button>
    )
}

export function BotaoDeslogar() {
    const navigate = useNavigate();

    const handleLogout = () => {

        localStorage.removeItem("token");
        localStorage.removeItem("usuario");

        navigate("/");

    };

    return (

        <button className='btn btn-lg' onClick={handleLogout}>Sair</button>
    )
}

export function BotaoCsv({ onClick }) {
    return (
        <button
            className="btn btn-success btn-mobile-full shadow-sm"
            onClick={onClick}
        >
            Baixar CSV
        </button>
    );
}

export function BotaoAlternarHistorico({ tipoHistorico, onClick }) {

    const proximoTipo =
        tipoHistorico === "Entrada"
            ? "Saída"
            : "Entrada";

    return (
        <button
            className="btn btn-dark btn-mobile-full shadow-sm"
            onClick={onClick}
        >
            Alternar para {proximoTipo}
        </button>
    );
}