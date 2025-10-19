"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle, Mail, Server } from "lucide-react";
import { api } from "@/lib/api";

export default function InboxCreateModal({ isOpen, onClose, onCreated }: any) {
    const [step, setStep] = useState(1);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    // shared fields
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("")
    const [type, setType] = useState<"gmail" | "imap" | null>(null);

    // imap config
    const [imapConfig, setImapConfig] = useState({
        host: "box.mailparserhub.com",
        port: 993,
        tls: true,
        password: "",
    });

    const gmailDefault = {
        configured: false,
        clientId: process.env.NEXT_PUBLIC_GMAIL_CLIENT_ID || "",
        clientSecret: "",
        refreshToken: "",
        redirectUri: process.env.NEXT_PUBLIC_GMAIL_REDIRECT_URI || "",
        user: "",
        password: ""
    };

    const reset = () => {
        setStep(1);
        setBusy(false);
        setError("");
        setName("");
        setEmail("");
        setType(null);
        setImapConfig({
            host: "box.mailparserhub.com",
            port: 993,
            tls: true,
            password: "",
        });
    };

    if (!isOpen) return null;

    const next = () => {
        setError("");
        if (step === 1) {
            if (!type) {
                setError("Please select a type first.");
                return;
            }
            setStep(2);
            return;
        }
        submit();
    };

    const back = () => {
        setError("");
        if (step === 1) return onClose();
        setStep((s) => s - 1);
    };

    async function submit() {
        if (!name.trim() || !email.trim()) {
            setError("Name and email are required.");
            return;
        }

        if (type === "imap" && !imapConfig.password.trim()) {
            setError("IMAP password is required.");
            return;
        }

        setBusy(true);
        setError("");

        try {
            const payload: any = {
                name,
                email,
                type,
                uploadsBase: `./uploads/${name.toLowerCase().replace(/\s/g, "-")}`,
                gmailConfig: null,
                imapConfig: null,
            };

            if (type === "imap") {
                payload.imapConfig = {
                    host: imapConfig.host,
                    port: Number(imapConfig.port) || 993,
                    tls: !!imapConfig.tls,
                    user: email, // same as email
                    password: imapConfig.password,
                };
            } else {
                gmailDefault.configured = true;
                gmailDefault.user = email;
                gmailDefault.password = password;
                payload.gmailConfig = gmailDefault;
            }

            const created = await api.inboxes.create(payload);
            if (onCreated) onCreated(created);
            reset();
            onClose();
        } catch (err: any) {
            console.error("Create inbox error:", err);
            setError(err?.message || "Failed to create inbox");
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <Card className="w-full max-w-2xl">
                <CardHeader className="flex items-center justify-between">
                    <CardTitle>
                        {step === 1 ? "Choose Inbox Type" : `Configure ${type?.toUpperCase()} Inbox`}
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            reset();
                            onClose();
                        }}
                    >
                        <XCircle className="h-5 w-5" />
                    </Button>
                </CardHeader>

                <CardContent>
                    {/* STEP 1 — TYPE SELECTION */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* IMAP */}
                                <div
                                    onClick={() => setType("imap")}
                                    className={`p-8 border rounded-2xl cursor-pointer transition-all flex flex-col items-center text-center ${type === "imap"
                                        ? "border-blue-500 bg-blue-50"
                                        : "border-muted hover:border-blue-300 hover:bg-blue-50/30"
                                        }`}
                                >
                                    <Server className="h-10 w-10 text-blue-600 mb-3" />
                                    <h3 className="text-lg font-semibold">Mailbox (IMAP)</h3>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Connect standard IMAP servers like Mail-in-a-Box or cPanel mail.
                                    </p>
                                </div>

                                {/* GMAIL */}
                                <div
                                    onClick={() => setType("gmail")}
                                    className={`p-8 border rounded-2xl cursor-pointer transition-all flex flex-col items-center text-center ${type === "gmail"
                                        ? "border-green-500 bg-green-50"
                                        : "border-muted hover:border-green-300 hover:bg-green-50/30"
                                        }`}
                                >
                                    <Mail className="h-10 w-10 text-green-600 mb-3" />
                                    <h3 className="text-lg font-semibold">Gmail</h3>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Connect Google accounts via OAuth (setup continues in settings).
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2 — CONFIGURATION */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Inbox Name</label>
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full rounded border px-3 py-2"
                                    placeholder="Support Inbox"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Email Address</label>
                                <input
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full rounded border px-3 py-2 font-mono"
                                    placeholder={type === "imap" ? "info@yourdomain.com" : "yourname@gmail.com"}
                                />
                            </div>
                            {type === "gmail" && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">Password </label>
                                    <input
                                        value={password}
                                        type="password"
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full rounded border px-3 py-2 font-mono"
                                        placeholder="**********"
                                    />
                                    <span>(Password set can be used to login to Gmail client)</span>
                                </div>
                            )}

                            {type === "imap" && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">IMAP Host</label>
                                        <input
                                            value={imapConfig.host}
                                            onChange={(e) => setImapConfig({ ...imapConfig, host: e.target.value })}
                                            className="w-full rounded border px-3 py-2"
                                            placeholder="box.mailparserhub.com"
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Port</label>
                                            <input
                                                value={String(imapConfig.port)}
                                                onChange={(e) => setImapConfig({ ...imapConfig, port: Number(e.target.value) })}
                                                className="w-full rounded border px-3 py-2"
                                                placeholder="993"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-1">TLS</label>
                                            <select
                                                value={imapConfig.tls ? "true" : "false"}
                                                onChange={(e) =>
                                                    setImapConfig({ ...imapConfig, tls: e.target.value === "true" })
                                                }
                                                className="w-full rounded border px-3 py-2"
                                            >
                                                <option value="true">True (TLS/SSL)</option>
                                                <option value="false">False</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">IMAP Password</label>
                                        <input
                                            type="password"
                                            value={imapConfig.password}
                                            onChange={(e) =>
                                                setImapConfig({ ...imapConfig, password: e.target.value })
                                            }
                                            className="w-full rounded border px-3 py-2"
                                            placeholder="••••••••"
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Stored encrypted on the server.
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {error && <div className="text-sm text-red-500 mt-3">{error}</div>}

                    <div className="mt-6 flex items-center justify-end gap-2">
                        <Button variant="ghost" onClick={back}>
                            {step === 1 ? "Cancel" : "Back"}
                        </Button>
                        <Button onClick={next} disabled={busy}>
                            {step === 1 ? "Next" : busy ? "Creating..." : "Create Inbox"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
