import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { API_URL } from "@/api";

interface CertData {
  valid: boolean;
  certId: string;
  studentName: string;
  subject: string;
  score: string;
  percentage: number;
  issuedAt: string;
}

export default function CertificateVerify() {
  const { certId } = useParams<{ certId: string }>();
  const [cert, setCert] = useState<CertData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!certId) return;
    fetch(`${API_URL}/certificates/verify/${certId}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setCert(data);
      })
      .catch(() => setError("Failed to reach the verification server."))
      .finally(() => setLoading(false));
  }, [certId]);

  const styles: Record<string, React.CSSProperties> = {
    page: {
      minHeight: "100vh",
      background: "linear-gradient(135deg,#0f172a 0%,#1e1b4b 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "Inter,system-ui,sans-serif", padding: 24,
    },
    card: {
      background: "linear-gradient(135deg,#111827,#0f172a)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 24,
      padding: "48px 44px",
      maxWidth: 520, width: "100%",
      textAlign: "center",
      boxShadow: "0 40px 80px rgba(0,0,0,0.7), 0 0 60px rgba(99,102,241,0.08)",
    },
    row: {
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "10px 16px", borderRadius: 8, marginBottom: 6,
    },
    label: { fontSize: 13, color: "#64748b", fontWeight: 600 },
    value: { fontSize: 14, color: "#f1f5f9", fontWeight: 500 },
  };

  if (loading) return (
    <div style={styles.page}>
      <div style={{ color: "#94a3b8", fontSize: 16 }}>Verifying certificate…</div>
    </div>
  );

  if (error) return (
    <div style={styles.page}>
      <div style={{ ...styles.card, borderColor: "rgba(239,68,68,0.35)" }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>❌</div>
        <h2 style={{ color: "#ef4444", fontSize: 22, fontWeight: 800, marginBottom: 10 }}>
          Invalid Certificate
        </h2>
        <p style={{ color: "#94a3b8", fontSize: 14 }}>{error}</p>
        <p style={{ color: "#475569", fontSize: 12, marginTop: 16 }}>
          Certificate ID: <strong style={{ color: "#64748b" }}>{certId}</strong>
        </p>
      </div>
    </div>
  );

  const dateStr = cert ? new Date(cert.issuedAt).toLocaleDateString("en-IN", {
    day: "2-digit", month: "long", year: "numeric",
  }) : "";

  return (
    <div style={styles.page}>
      <div style={{ ...styles.card, borderColor: "rgba(99,102,241,0.3)" }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg,#6366f1,#818cf8)",
          borderRadius: 12, padding: "14px 24px", marginBottom: 28,
        }}>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 11,
            margin: 0, letterSpacing: 1, textTransform: "uppercase" }}>
            Knowledge Hub · Digital Assessment Portal
          </p>
        </div>

        {/* Valid badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(16,185,129,0.12)",
          border: "1px solid rgba(16,185,129,0.35)",
          borderRadius: 100, padding: "6px 18px", marginBottom: 24,
        }}>
          <span style={{ color: "#10b981", fontSize: 14 }}>✓</span>
          <span style={{ color: "#10b981", fontSize: 12, fontWeight: 700 }}>
            VERIFIED & AUTHENTIC
          </span>
        </div>

        <div style={{ fontSize: 52, marginBottom: 12 }}>🏆</div>

        <h1 style={{
          fontSize: 24, fontWeight: 800, color: "#f1f5f9",
          letterSpacing: "-0.5px", marginBottom: 4,
        }}>
          Certificate of Completion
        </h1>
        <p style={{ color: "#64748b", fontSize: 13, marginBottom: 28 }}>
          This certificate has been verified as authentic
        </p>

        {/* Details table */}
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "4px 0" }}>
          {[
            ["Student", cert!.studentName],
            ["Subject / Test", cert!.subject],
            ["Score", cert!.score],
            ["Percentage", `${cert!.percentage}%`],
            ["Issued On", dateStr],
            ["Certificate ID", cert!.certId],
          ].map(([label, value], i) => (
            <div key={label} style={{
              ...styles.row,
              background: i % 2 === 0 ? "rgba(255,255,255,0.03)" : "transparent",
            }}>
              <span style={styles.label}>{label}</span>
              <span style={{
                ...styles.value,
                color: label === "Percentage" ? "#818cf8" : "#f1f5f9",
                fontWeight: label === "Certificate ID" ? 700 : 500,
                fontSize: label === "Certificate ID" ? 12 : 14,
                letterSpacing: label === "Certificate ID" ? 1 : 0,
              }}>{value}</span>
            </div>
          ))}
        </div>

        <p style={{ color: "#334155", fontSize: 11, marginTop: 24 }}>
          Verified on {new Date().toLocaleDateString("en-IN")} · Knowledge Hub Portal
        </p>
      </div>
    </div>
  );
}
