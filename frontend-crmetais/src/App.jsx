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
import PrivateRoute from './components/PrivateRoute';

function App() {

  return (

    <BrowserRouter>
      <div className='conteudo vh-100 d-flex flex-column'>

        <Routes>

          {/* Rotas públicas */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />

          {/* Rotas protegidas */}
          <Route path="/resumo" element={
            <PrivateRoute><Resumo /></PrivateRoute>
          } />

          <Route path="/historico" element={
            <PrivateRoute><Historico /></PrivateRoute>
          } />

          <Route path="/fornecedores" element={
            <PrivateRoute><Fornecedores /></PrivateRoute>
          } />

          <Route path="/clientes" element={
            <PrivateRoute><Clientes /></PrivateRoute>
          } />

          <Route path="/tabelas-preco" element={
            <PrivateRoute><TabelasPreco /></PrivateRoute>
          } />

          <Route path="/boleta" element={
            <PrivateRoute><Boleta /></PrivateRoute>
          } />

          <Route path="/gestao-de-dados" element={
            <PrivateRoute><GestaoDeDados /></PrivateRoute>
          } />

          <Route path="/dashboard" element={
            <PrivateRoute><Dashboard /></PrivateRoute>
          } />

        </Routes>

      </div>
    </BrowserRouter>

  )
}

export default App;