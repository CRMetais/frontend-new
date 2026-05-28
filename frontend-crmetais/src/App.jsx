import React from 'react';
import { Login } from './pages/Login';
import { Resumo } from './pages/Resumo';
import { Historico } from './pages/Historico';
import { Fornecedores } from './pages/Fornecedores';
import { Clientes } from './pages/Clientes';
import { TabelasPreco } from './pages/TabelasPreco';
import { Boleta } from './pages/Boleta';
import { GestaoDeDados } from './pages/GestaoDeDados';
import { Dashboard } from './pages/Dashboard';
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {

  return (

    <BrowserRouter>
      <div className='conteudo vh-100 d-flex flex-column'>

        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/resumo" element={<Resumo />} />
          <Route path="/historico" element={<Historico />} />
          <Route path="/fornecedores" element={<Fornecedores />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/tabelas-preco" element={<TabelasPreco />} />
          <Route path="/boleta" element={<Boleta />} />
          <Route path="/gestao-de-dados" element={<GestaoDeDados />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>

      </div>
    </BrowserRouter>

  )
}

export default App
