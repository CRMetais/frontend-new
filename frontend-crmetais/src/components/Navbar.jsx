import React from "react";
import { NavLink } from "react-router-dom";
import { BotaoDeslogar } from "./Buttons";
import { isUsuarioComum } from "../services/UsuarioService";
import Logo from "../assets/logo.png";
import "../styles/Navbar.css";

export default function Navbar() {

    const usuarioComum = isUsuarioComum();

    return (

        <nav className="navbar navbar-expand-lg bg-body-tertiary border shadow-sm text-nowrap">

            <div className="container-fluid ms-3 me-3">

                {/* Logo */}
                <div className="logotipo d-flex align-items-center gap-1">
                    <img className="logo" src={Logo} alt="Logo da empresa CR Metais"/>
                    <div className="titulo fw-bold">CR Metais</div>
                </div>

                {/* Botão mobile */}
                <button
                    className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarConteudo" aria-controls="navbarConteudo" aria-expanded="false" aria-label="Abrir navegação" >
                    <span className="navbar-toggler-icon"></span>
                </button>

                {/* Conteúdo colapsável */}
                <div
                    className="collapse navbar-collapse justify-content-between" id="navbarConteudo">

                    {/* Links */}
                    <div className="navbar-nav mx-auto gap-0 gap-xl-4 text-center">
                        <NavLink to="/resumo" className="nav-link">Resumo</NavLink>
                        <NavLink to="/historico" className="nav-link">Histórico</NavLink>
                        <NavLink to="/fornecedores" className="nav-link">Fornecedores</NavLink>
                        <NavLink to="/clientes" className="nav-link">Clientes</NavLink>
                        <NavLink to="/tabelas-preco" className="nav-link">Tabelas Preço</NavLink>
                        <NavLink to="/boleta" className="nav-link">Boleta</NavLink>
                        {!usuarioComum && <NavLink to="/gestao-de-dados" className="nav-link">Gestão de Dados</NavLink>}
                        {!usuarioComum && <NavLink to="/dashboard" className="nav-link">Dashboard</NavLink>}
                    </div>

                    {/* Botão sair */}
                    <div className="d-flex justify-content-center mt-3 mt-lg-0">
                        <BotaoDeslogar />
                    </div>
                </div>

            </div>
        </nav>
    );
}