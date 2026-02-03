import React from "react";
import { Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Products from "./pages/Products.jsx";
import { getToken, clearToken } from "./api.js";

function PrivateRoute({ children }) {
    return getToken() ? children : <Navigate to="/login" replace />;
}

export default function App() {
    const nav = useNavigate();

    return (
        <div style={{ maxWidth: 900, margin: "24px auto", fontFamily: "Arial" }}>
            <header style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
                <Link to="/" style={{ textDecoration: "none" }}><b>Stock</b></Link>
                <div style={{ marginLeft: "auto" }}>
                    {getToken() ? (
                        <button onClick={() => { clearToken(); nav("/login"); }}>
                            Sair
                        </button>
                    ) : null}
                </div>
            </header>

            <Routes>
                <Route path="/" element={<PrivateRoute><Products /></PrivateRoute>} />
                <Route path="/login" element={<Login />} />
            </Routes>
        </div>
    );
}
