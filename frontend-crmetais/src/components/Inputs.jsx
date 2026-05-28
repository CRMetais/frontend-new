import React from 'react';

export function InputEmail({ email, onChange }) {
    return (
        <div className="input-group mb-3">
            <span className="input-group-text shadow-sm" id="basic-addon1">Seu email</span>
            <input type="email" className="form-control shadow-sm" placeholder="exemplo@gmail.com" aria-label="Email" aria-describedby="basic-addon1" value={email} onChange={onChange} />
        </div>
    );
}

export function InputSenha({ senha, onChange }) {
    return (
        <div className="input-group mb-3">
            <span className="input-group-text shadow-sm" id="basic-addon1">Sua senha</span>
            <input type="password" className="form-control shadow-sm" placeholder="* * * * * * * *" aria-label="Senha" aria-describedby="basic-addon1" value={senha} onChange={onChange} />
        </div>
    );
}

export function InputPesquisa({ value, onChange }) {
    return (
        <div className="input-group mb-3">
            <span className="input-group-text shadow-sm" id="basic-addon1">Pesquisar produto</span>
            <input value={value} onChange={onChange} type="text" className="form-control shadow-sm" placeholder="Buscar por produto ou parceiro" aria-label="Pesquisa" aria-describedby="basic-addon1" />
        </div>
    );
}

export function InputPesquisaFornecedor({ value, onChange }) {
    return (
        <div className="input-group mb-3">
            <span className="input-group-text shadow-sm" id="basic-addon1">Pesquisar fornecedor</span>
            <input value={value} onChange={onChange} type="text" className="form-control shadow-sm" placeholder="Ex: Carlos" aria-label="Pesquisa" aria-describedby="basic-addon1" />
        </div>
    );
}

export function InputPesquisaCliente({ value, onChange }) {
    return (
        <div className="input-group mb-3">
            <span className="input-group-text shadow-sm" id="basic-addon1">Pesquisar cliente</span>
            <input value={value} onChange={onChange} type="text" className="form-control shadow-sm" placeholder="Ex: Empresa Ltda" aria-label="Pesquisa" aria-describedby="basic-addon1" />
        </div>
    );
}
