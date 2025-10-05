import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import Layout from "../components/Layout";
import { http } from "../lib/http";
import "../styles/Certificate.css";
import LogoRota from "../images/LogoRotaHeader.png";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

type CertificatePayload = {
  trail_id: number;
  trail_title: string;
  student_name: string;
  credential_id: string;
  certificate_hash: string;
  issued_at?: string | null;
  verification_url: string;
  qr_code_data_uri: string;
};

export default function Certificate() {
  const location = useLocation();
  const [data, setData] = useState<CertificatePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const certificateRef = useRef<HTMLDivElement | null>(null);

  const certHash = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("cert_hash");
  }, [location.search]);

  useEffect(() => {
    async function fetchCertificate() {
      if (!certHash) {
        setError("Certificado não encontrado. Verifique o link recebido.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const verifyBase =
          typeof window !== "undefined" ? window.location.origin : undefined;
        const { data } = await http.get<CertificatePayload>(
          `/certificates/${encodeURIComponent(certHash)}`,
          verifyBase
            ? { params: { verify_base: verifyBase } }
            : undefined
        );
        setData(data);
      } catch (err: any) {
        if (err?.response?.status === 404) {
          setError("Certificado não encontrado ou expirado.");
        } else {
          setError("Não foi possível carregar o certificado.");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchCertificate();
  }, [certHash]);

  const issuedDate = useMemo(() => {
    if (!data?.issued_at) return null;
    const dt = new Date(data.issued_at);
    if (Number.isNaN(dt.getTime())) return null;
    return dt.toLocaleDateString("pt-BR");
  }, [data?.issued_at]);

  async function handleDownload() {
    if (!certificateRef.current || !data) return;
    setDownloadError(null);
    try {
      setDownloading(true);
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: canvas.width >= canvas.height ? "landscape" : "portrait",
        unit: "px",
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`certificado-${data.certificate_hash}.pdf`);
    } catch (err) {
      console.error("Falha ao gerar PDF do certificado", err);
      setDownloadError("Não foi possível gerar o PDF agora. Tente novamente.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Layout>
      <section className="certificate-page">
        <div className="certificate-container">
          {loading ? (
            <div className="certificate-status">Carregando certificado…</div>
          ) : error ? (
            <div className="certificate-status error">{error}</div>
          ) : data ? (
            <>
              <h1 className="certificate-title">{data.trail_title}</h1>
              <div className="certificate-wrapper">
                <div className="certificate-frame" ref={certificateRef}>
                  <div className="certificate-border">
                    <div className="certificate-inner">
                      <p className="certificate-subhead">Certificado</p>
                      <h2 className="certificate-headline">de conclusão</h2>
                      <p className="certificate-text">
                        Este certificado comprova que
                      </p>
                      <div className="certificate-name">{data.student_name}</div>
                      <p className="certificate-text">concluiu o curso de :</p>
                      <div className="certificate-course">{data.trail_title}</div>

                      <div className="certificate-footer-row">
                        <div className="certificate-qr">
                          <img
                            src={data.qr_code_data_uri}
                            alt="Código QR para validar o certificado"
                          />
                          <span className="certificate-qr-id">
                            {`#${data.credential_id}`}
                          </span>
                        </div>
                        <div className="certificate-date-block">
                          <span className="certificate-date-label">Data de emissão</span>
                          <span className="certificate-date-value">
                            {issuedDate ?? "--"}
                          </span>
                        </div>
                        <div className="certificate-logo">
                          <img src={LogoRota} alt="Projeto Rota" />
                          <span>Equipe ENACTUS Mackenzie</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="certificate-meta">
                  <div>
                    <strong>ID da credencial</strong>
                    <span>{`#${data.credential_id}`}</span>
                  </div>
                  <div>
                    <strong>Emitida pela</strong>
                    <span>ROTA - ENACTUS Mackenzie</span>
                  </div>
                  <div>
                    <strong>Data de emissão</strong>
                    <span>{issuedDate ?? "--"}</span>
                  </div>
                </div>

                <div className="certificate-actions">
                  <button
                    type="button"
                    className="certificate-download"
                    onClick={handleDownload}
                    disabled={downloading}
                  >
                    {downloading ? "Gerando PDF…" : "Baixar certificado (PDF)"}
                  </button>
                </div>
                {downloadError ? (
                  <div className="certificate-download-error" role="alert">
                    {downloadError}
                  </div>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
      </section>
    </Layout>
  );
}
