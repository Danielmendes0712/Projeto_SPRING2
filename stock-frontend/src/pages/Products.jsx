import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api.js";

export default function Products() {
    const [q, setQ] = useState("");
    const [status, setStatus] = useState("ACTIVE");
    const [items, setItems] = useState([]);
    const [msg, setMsg] = useState("");
    const [loading, setLoading] = useState(false);

    const [desc, setDesc] = useState("");
    const [qty, setQty] = useState("");

    // Ordenação (client-side)
    const [sortBy, setSortBy] = useState("ID"); // ID | DESCRIPTION | QUANTITY | STATUS
    const [sortDir, setSortDir] = useState("ASC"); // ASC | DESC

    // Saída inline (sem popup)
    const [stockOutId, setStockOutId] = useState(null);
    const [stockOutQty, setStockOutQty] = useState("");

    const statusBadge = useMemo(() => {
        if (status === "ACTIVE") return { text: "Ativos", cls: "badge badgeOk" };
        if (status === "DELETED") return { text: "Excluídos", cls: "badge badgeDanger" };
        return { text: "Todos", cls: "badge" };
    }, [status]);

    async function load() {
        setMsg("");
        setLoading(true);
        try {
            const data = await api(
                `/api/products?q=${encodeURIComponent(q)}&status=${encodeURIComponent(status)}`
            );
            setItems(data || []);
        } catch (e) {
            setMsg(String(e.message));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    async function create() {
        setMsg("");

        const cleanDesc = desc.trim();
        const nQty = Number(qty);

        if (!cleanDesc) {
            setMsg("Descrição é obrigatória.");
            return;
        }
        if (!Number.isFinite(nQty) || nQty <= 0) {
            setMsg("Quantidade deve ser maior que 0.");
            return;
        }

        setLoading(true);
        try {
            await api("/api/products", {
                method: "POST",
                body: { description: cleanDesc, quantity: nQty },
            });

            setDesc("");
            setQty("");
            await load();
        } catch (e) {
            setMsg(String(e.message));
        } finally {
            setLoading(false);
        }
    }

    async function softDelete(id) {
        setLoading(true);
        try {
            await api(`/api/products/${id}`, { method: "DELETE" });

            if (stockOutId === id) {
                setStockOutId(null);
                setStockOutQty("");
            }

            await load();
        } finally {
            setLoading(false);
        }
    }

    async function restore(id) {
        setLoading(true);
        try {
            await api(`/api/products/${id}/restore`, { method: "POST" });
            await load();
        } finally {
            setLoading(false);
        }
    }

    function openStockOut(id) {
        setMsg("");
        setStockOutId(id);
        setStockOutQty("");
    }

    function cancelStockOut() {
        setStockOutId(null);
        setStockOutQty("");
    }

    async function confirmStockOut(product) {
        setMsg("");

        const n = Number(stockOutQty);

        if (!Number.isFinite(n) || n <= 0) {
            setMsg("Quantidade de saída deve ser maior que 0.");
            return;
        }
        if (n > Number(product.quantity)) {
            setMsg("Quantidade de saída maior que o estoque atual.");
            return;
        }

        setLoading(true);
        try {
            await api(`/api/products/${product.id}/stock-out`, {
                method: "POST",
                body: { quantity: n },
            });

            cancelStockOut();
            await load();
        } catch (e) {
            setMsg(String(e.message));
        } finally {
            setLoading(false);
        }
    }

    function onEnterCreate(e) {
        if (e.key === "Enter") create();
    }

    function onEnterConfirmStockOut(e, product) {
        if (e.key === "Enter") confirmStockOut(product);
        if (e.key === "Escape") cancelStockOut();
    }

    function toggleSortDir() {
        setSortDir((d) => (d === "ASC" ? "DESC" : "ASC"));
    }

    // Lista ordenada (sem mexer no backend)
    const sortedItems = useMemo(() => {
        const arr = Array.isArray(items) ? [...items] : [];
        const dir = sortDir === "ASC" ? 1 : -1;

        const statusValue = (p) => (p.deleted ? 1 : 0); // 0=ATIVO, 1=EXCLUÍDO

        const cmpNum = (a, b) => (a === b ? 0 : a > b ? 1 : -1);
        const cmpStr = (a, b) => String(a ?? "").localeCompare(String(b ?? ""), "pt-BR", { sensitivity: "base" });

        arr.sort((a, b) => {
            let c = 0;

            if (sortBy === "ID") {
                c = cmpNum(Number(a.id), Number(b.id));
            } else if (sortBy === "QUANTITY") {
                c = cmpNum(Number(a.quantity), Number(b.quantity));
            } else if (sortBy === "DESCRIPTION") {
                c = cmpStr(a.description, b.description);
            } else if (sortBy === "STATUS") {
                // ASC: ativos primeiro, depois excluídos
                c = cmpNum(statusValue(a), statusValue(b));
                // desempate por descrição para ficar estável
                if (c === 0) c = cmpStr(a.description, b.description);
            }

            // desempate geral (para estabilidade)
            if (c === 0) c = cmpNum(Number(a.id), Number(b.id));

            return c * dir;
        });

        return arr;
    }, [items, sortBy, sortDir]);

    return (
        <div className="container">
            <div className="topbar" style={{ marginBottom: 14 }}>
                <div className="brand">
                    <span className="brandDot" />
                    Stock Manager
                </div>
                <div className="spacer" />
                <span className={statusBadge.cls}>{statusBadge.text}</span>
            </div>

            <div className="grid">
                <div className="card">
                    <div className="cardBody">
                        <div className="row">
                            <div className="field" style={{ flex: 1, minWidth: 220 }}>
                                <span className="label">Buscar</span>
                                <input
                                    className="input"
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                    placeholder="ex: banana"
                                />
                            </div>

                            <div className="field" style={{ minWidth: 160 }}>
                                <span className="label">Status</span>
                                <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
                                    <option value="ACTIVE">Ativos</option>
                                    <option value="DELETED">Excluídos</option>
                                    <option value="ALL">Todos</option>
                                </select>
                            </div>

                            <div className="field" style={{ minWidth: 190 }}>
                                <span className="label">Ordenar por</span>
                                <select className="select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                    <option value="ID">ID</option>
                                    <option value="DESCRIPTION">Descrição</option>
                                    <option value="QUANTITY">Quantidade</option>
                                    <option value="STATUS">Status</option>
                                </select>
                            </div>

                            <button className="btn" onClick={toggleSortDir} disabled={loading} style={{ flexShrink: 0 }}>
                                {sortDir === "ASC" ? "Cresc ↑" : "Desc ↓"}
                            </button>

                            <button className="btn btnPrimary" onClick={load} disabled={loading} style={{ flexShrink: 0 }}>
                                {loading ? "Carregando..." : "Buscar"}
                            </button>
                        </div>

                        {msg ? (
                            <div className="alert" style={{ marginTop: 12 }}>
                                {msg}
                            </div>
                        ) : null}
                    </div>
                </div>

                <div className="card">
                    <div className="cardHeader">
                        <h3 className="cardTitle">Novo produto</h3>
                        <p className="cardSub">Cadastro rápido de produto e quantidade inicial.</p>
                    </div>

                    <div className="cardBody">
                        <div className="row" style={{ alignItems: "end" }}>
                            <div className="field" style={{ flex: 1, minWidth: 180 }}>
                                <span className="label">Descrição</span>
                                <input
                                    className="input"
                                    value={desc}
                                    onChange={(e) => setDesc(e.target.value)}
                                    placeholder="ex: banana nanica"
                                    onKeyDown={onEnterCreate}
                                />
                            </div>

                            <div className="field" style={{ width: 200, flexShrink: 0 }}>
                                <span className="label">Quantidade</span>
                                <input
                                    className="input"
                                    value={qty}
                                    onChange={(e) => setQty(e.target.value)}
                                    type="number"
                                    min="1"
                                    step="1"
                                    placeholder="1"
                                    onKeyDown={onEnterCreate}
                                />
                            </div>

                            <button className="btn btnPrimary" onClick={create} disabled={loading} style={{ flexShrink: 0 }}>
                                Criar
                            </button>
                        </div>
                    </div>
                </div>

                <div className="tableWrap">
                    <table className="table">
                        <thead>
                            <tr>
                                <th style={{ width: 80 }}>ID</th>
                                <th>Descrição</th>
                                <th style={{ width: 110 }}>Qtd</th>
                                <th style={{ width: 120 }}>Status</th>
                                <th style={{ width: 520 }}>Ações</th>
                            </tr>
                        </thead>

                        <tbody>
                            {sortedItems.map((p) => {
                                const isEditingStockOut = stockOutId === p.id && !p.deleted;

                                return (
                                    <tr key={p.id}>
                                        <td>{p.id}</td>
                                        <td>{p.description}</td>
                                        <td>{p.quantity}</td>

                                        <td>
                                            {p.deleted ? (
                                                <span className="badge badgeDanger">EXCLUÍDO</span>
                                            ) : (
                                                <span className="badge badgeOk">ATIVO</span>
                                            )}
                                        </td>

                                        <td style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                                            {!p.deleted ? (
                                                !isEditingStockOut ? (
                                                    <button
                                                        className="btn"
                                                        onClick={() => openStockOut(p.id)}
                                                        disabled={loading}
                                                        style={{ flexShrink: 0 }}
                                                    >
                                                        Saída
                                                    </button>
                                                ) : (
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            gap: 8,
                                                            flexWrap: "nowrap",
                                                            alignItems: "center",
                                                            flexShrink: 0,
                                                            maxWidth: "100%",
                                                        }}
                                                    >
                                                        <input
                                                            className="input"
                                                            value={stockOutQty}
                                                            onChange={(e) => setStockOutQty(e.target.value)}
                                                            type="number"
                                                            min="1"
                                                            step="1"
                                                            placeholder="Qtd"
                                                            onKeyDown={(e) => onEnterConfirmStockOut(e, p)}
                                                            autoFocus
                                                            style={{ width: 74, padding: "0 10px", flexShrink: 0 }}
                                                        />

                                                        <button
                                                            className="btn btnPrimary"
                                                            onClick={() => confirmStockOut(p)}
                                                            disabled={loading}
                                                            style={{ flexShrink: 0 }}
                                                        >
                                                            Confirmar
                                                        </button>

                                                        <button
                                                            className="btn btnGhost"
                                                            onClick={cancelStockOut}
                                                            disabled={loading}
                                                            style={{ flexShrink: 0 }}
                                                        >
                                                            Cancelar
                                                        </button>
                                                    </div>
                                                )
                                            ) : null}

                                            {!p.deleted ? (
                                                <button
                                                    className="btn btnDanger"
                                                    onClick={() => softDelete(p.id)}
                                                    disabled={loading}
                                                    style={{ flexShrink: 0 }}
                                                >
                                                    Excluir
                                                </button>
                                            ) : null}

                                            {p.deleted ? (
                                                <button
                                                    className="btn btnPrimary"
                                                    onClick={() => restore(p.id)}
                                                    disabled={loading}
                                                    style={{ flexShrink: 0 }}
                                                >
                                                    Restaurar
                                                </button>
                                            ) : null}
                                        </td>
                                    </tr>
                                );
                            })}

                            {!loading && sortedItems.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ color: "var(--muted)" }}>
                                        Nenhum produto encontrado.
                                    </td>
                                </tr>
                            ) : null}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
