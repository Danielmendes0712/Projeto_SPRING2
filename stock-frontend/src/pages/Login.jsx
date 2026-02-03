import React, { useMemo, useState } from "react";
import { api, setToken } from "../api.js";
import { useNavigate } from "react-router-dom";

export default function Login() {
    const nav = useNavigate();

    // campos começam vazios
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    // alterna modo
    const [mode, setMode] = useState("login"); // "login" | "register"

    const [msg, setMsg] = useState("");
    const [loading, setLoading] = useState(false);

    const title = useMemo(() => (mode === "login" ? "Entrar" : "Registrar"), [mode]);
    const subtitle = useMemo(() => {
        return mode === "login"
            ? "Use seu usuário e senha para acessar."
            : "Crie um usuário e senha para começar.";
    }, [mode]);

    function resetFeedback() {
        setMsg("");
    }

    function toggleMode() {
        resetFeedback();
        setMode((m) => (m === "login" ? "register" : "login"));
        setUsername("");
        setPassword("");
    }

    async function handleSubmit() {
        resetFeedback();
        if (!username.trim() || !password.trim()) {
            setMsg("Preencha usuário e senha.");
            return;
        }

        setLoading(true);
        try {
            if (mode === "register") {
                await api("/api/auth/register", {
                    method: "POST",
                    body: { username: username.trim(), password: password.trim() },
                });

                setMsg("Registrado. Agora faça login.");
                setMode("login");
                setUsername("");
                setPassword("");
                return;
            }

            // login
            const r = await api("/api/auth/login", {
                method: "POST",
                body: { username: username.trim(), password: password.trim() },
            });

            setToken(r.token);
            nav("/");
        } catch (e) {
            setMsg(String(e.message));
        } finally {
            setLoading(false);
        }
    }

    function onKeyDown(e) {
        if (e.key === "Enter") handleSubmit();
    }

    return (
        <div className="centerPage">
            <div className="container" style={{ width: "min(980px, 92vw)" }}>
                <div className="topbar" style={{ marginBottom: 14 }}>
                    <div className="brand">
                        <span className="brandDot" />
                        Stock Manager
                    </div>
                    <div className="spacer" />
                    <span className="badge">{mode === "login" ? "Login" : "Registro"}</span>
                </div>

                <div className="card" style={{ width: "min(520px, 92vw)", margin: "0 auto" }}>
                    <div className="cardHeader">
                        <h2 className="cardTitle">{title}</h2>
                        <p className="cardSub">{subtitle}</p>
                    </div>

                    <div className="cardBody">
                        <div className="grid">
                            <div className="field">
                                <span className="label">Usuário</span>
                                <input
                                    className="input"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="ex: daniel"
                                    autoComplete={mode === "login" ? "username" : "new-username"}
                                    onKeyDown={onKeyDown}
                                />
                            </div>

                            <div className="field">
                                <span className="label">Senha</span>
                                <input
                                    className="input"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    type="password"
                                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                                    onKeyDown={onKeyDown}
                                />
                            </div>

                            <div className="row" style={{ justifyContent: "space-between" }}>
                                <button className="btn btnPrimary" onClick={handleSubmit} disabled={loading}>
                                    {loading ? (mode === "login" ? "Entrando..." : "Registrando...") : title}
                                </button>

                                <button className="btn btnGhost" onClick={toggleMode} disabled={loading}>
                                    {mode === "login" ? "Ir para registrar" : "Voltar para login"}
                                </button>
                            </div>

                            {msg ? <div className="alert">{msg}</div> : null}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
