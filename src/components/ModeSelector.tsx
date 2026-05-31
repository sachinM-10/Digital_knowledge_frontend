import { useState } from "react";

interface ModeSelectorProps {
  subject: string;
  onSelect: (mode: "PRACTICE" | "EXAM") => void;
}

export default function ModeSelector({ subject, onSelect }: ModeSelectorProps) {
  const [hoveredMode, setHoveredMode] = useState<"PRACTICE" | "EXAM" | null>(null);

  const modes: {
    id: "PRACTICE" | "EXAM";
    icon: string;
    title: string;
    subtitle: string;
    features: string[];
    color: string;
    glow: string;
  }[] = [
    {
      id: "PRACTICE",
      icon: "📘",
      title: "Practice Mode",
      subtitle: "Learn at your own pace",
      features: [
        "No time limit",
        "Instant answer feedback",
        "Retry any question",
        "Score tracked for practice",
        "No proctoring required",
      ],
      color: "linear-gradient(135deg,#059669,#10b981)",
      glow:  "rgba(16,185,129,0.25)",
    },
    {
      id: "EXAM",
      icon: "🎯",
      title: "Exam Mode",
      subtitle: "Full proctored assessment",
      features: [
        "30 minute timer",
        "Answers revealed after submit",
        "Proctor mode active",
        "Auto-submit on violations",
        "Certificate generated on pass",
      ],
      color: "linear-gradient(135deg,#6366f1,#818cf8)",
      glow:  "rgba(99,102,241,0.25)",
    },
  ];

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.88)",
      backdropFilter: "blur(14px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 9999, fontFamily: "Inter,system-ui,sans-serif",
    }}>
      <div style={{
        background: "linear-gradient(135deg,#111827,#0f172a)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 28,
        padding: "52px 48px",
        maxWidth: 620, width: "92%",
        textAlign: "center",
        boxShadow: "0 40px 80px rgba(0,0,0,0.7)",
      }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>📚</div>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "#f1f5f9",
          letterSpacing: "-0.5px", margin: "0 0 6px" }}>
          {subject} Assessment
        </h2>
        <p style={{ fontSize: 14, color: "#64748b", marginBottom: 36 }}>
          Choose how you want to take this quiz
        </p>

        <div style={{ display: "flex", gap: 18 }}>
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => onSelect(m.id)}
              onMouseEnter={() => setHoveredMode(m.id)}
              onMouseLeave={() => setHoveredMode(null)}
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.03)",
                border: `1.5px solid ${hoveredMode === m.id ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.07)"}`,
                borderRadius: 18,
                padding: "28px 20px",
                cursor: "pointer",
                textAlign: "center",
                transition: "all 0.25s ease",
                transform: hoveredMode === m.id ? "translateY(-4px)" : "none",
                boxShadow: hoveredMode === m.id ? `0 16px 40px ${m.glow}` : "none",
              }}
            >
              {/* Mode icon pill */}
              <div style={{
                width: 56, height: 56, borderRadius: "50%",
                background: m.color,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 26, margin: "0 auto 16px",
                boxShadow: `0 0 40px ${m.glow}`,
              }}>
                {m.icon}
              </div>

              <div style={{ fontSize: 17, fontWeight: 700, color: "#f1f5f9",
                marginBottom: 4 }}>{m.title}</div>
              <div style={{ fontSize: 12, color: "#64748b",
                marginBottom: 18 }}>{m.subtitle}</div>

              <ul style={{ listStyle: "none", padding: 0, margin: 0,
                textAlign: "left" }}>
                {m.features.map((f) => (
                  <li key={f} style={{
                    fontSize: 12, color: "#94a3b8",
                    padding: "5px 0",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <span style={{ color: "#6366f1", fontSize: 14 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <div style={{
                marginTop: 22,
                padding: "11px 0",
                borderRadius: 10,
                background: m.color,
                color: "white",
                fontWeight: 700, fontSize: 13,
                boxShadow: `0 4px 16px ${m.glow}`,
              }}>
                Start {m.title}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
