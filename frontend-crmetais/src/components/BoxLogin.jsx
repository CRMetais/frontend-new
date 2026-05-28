import React, { useState, useEffect } from "react";
import { InputEmail, InputSenha } from "./Inputs";
import { BotaoLogin } from "./Buttons";
import Logo from "../assets/logo.png"
import "../styles/BoxLogin.css";
import { buscarUsuarioPorId, extrairUsuarioPersistivel, salvarUsuarioLogado } from "../services/UsuarioService";
import api, { API_URL } from "../services/ApiClient";
import { useNavigate } from "react-router-dom";
import { BrowserRouter, Routes, Route } from "react-router-dom";


export function BoxLogin() {

    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [erro, setErro] = useState('');
    const [carregando, setCarregando] = useState(false);


    useEffect(() => {
        document.title = 'CR Metais | Login';
    }, []);


    const enviar = async () => {
        setErro('');

        if (!email || !senha) {
            console.log(email, senha)
            setErro('Informe email e senha.');
            return;
        }

        try {
            setCarregando(true);

            const resposta = await fetch(`${API_URL}/usuarios/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, senha }),
            });

            if (!resposta.ok) {
                let mensagem = 'Não foi possível fazer login.';
                try {
                    const erroBody = await resposta.json();
                    mensagem = erroBody?.message || erroBody?.erro || mensagem;
                } catch {
                    // ignora se não vier JSON
                }

                if (resposta.status === 401) {
                    setErro(mensagem || 'Credenciais inválidas.');
                } else {
                    setErro(mensagem);
                }
                return;
            }

            const dados = await resposta.json();

            // Ajuste conforme o nome do campo retornado no seu UsuarioTokenDto
            const token = dados?.token || dados?.accessToken || dados?.jwt;

            if (token) {
                localStorage.setItem('token', token);
            }

            const usuarioPersistivel = extrairUsuarioPersistivel(dados);
            const idUsuario = usuarioPersistivel?.idUsuario || usuarioPersistivel?.id || dados?.userId;

            if (idUsuario) {
                try {
                    const usuarioCompleto = await buscarUsuarioPorId(idUsuario);
                    salvarUsuarioLogado(usuarioCompleto);
                } catch {
                    salvarUsuarioLogado(usuarioPersistivel || dados);
                }
            } else {
                salvarUsuarioLogado(usuarioPersistivel || dados);
            }

            // setCurrentPage('Resumo');
            navigate('/resumo')
        } catch {
            setErro('Erro de conexão com o servidor.');
        } finally {
            setCarregando(false);
        }
    };

    return (

        <div className='boxLogin container-sm border h-50 rounded-3 p-4 shadow-sm'>


            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    enviar();
                }}
            >

                {/* Logo e nome da empresa */}
                <div className="d-flex flex-column pt-4 pb-5 justify-content-center align-items-center gap-3">
                    <div className="logotipo d-flex gap-3">
                        <img className="logo" src={Logo} alt="Logo da empresa CR Metais" />
                        <h1 className="titulo fw-bold">CR Metais</h1>
                    </div>

                    <h2 className="subtitulo">Bem-vindo de volta!</h2>
                </div>


                {/* Inputs */}
                <div className="d-flex flex-column pt-1 pb-4">
                    <InputEmail value={email} onChange={(e) => setEmail(e.target.value)} />
                    <InputSenha value={senha} onChange={(e) => setSenha(e.target.value)} />
                </div>

                <p className="text-danger mb-3 text-center">{erro}</p>

                {/* Botão login */}
                <div className="pb-4">
                    <BotaoLogin />
                </div>

            </form>
        </div>
    )
}