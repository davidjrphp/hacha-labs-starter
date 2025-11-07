import { useEffect, useMemo, useState } from "react";
import http from "../api/http.js";
import { Link } from "react-router-dom";

const SERVICE_ITEMS = [
  { key: "chem", label: "Clinical Chemistry", icon: "bi-flask" },
  { key: "heme", label: "Haematology",        icon: "bi-droplet-fill" },
  { key: "sero", label: "Serology",           icon: "bi-shield-check" },
  { key: "micro",label: "Microbiology",       icon: "bi-bug" },
  { key: "mol",  label: "Molecular",          icon: "bi-diagram-3" },
  { key: "res",  label: "Research",           icon: "bi-search" },
  { key: "well", label: "Wellness Programs",  icon: "bi-heart-pulse" },
];

const SERVICE_DETAILS = {
  chem:  ["LFTs (full panel)","RFTs (full panel)","Cardiac Profile","Hormonal Profile","Lipid Profile","RBS/FBS","Electrolytes (combo)"],
  heme:  ["FBC/CBC","WBC Absolute Count","Sickling Test","ESR"],
  sero:  ["H. Pylori","PSA","Hepatitis Profile (A,B,C)","Blood Grouping","Widal Test","Rheumatoid Factor","Syphilis Test","Gravindex Test","STI Profile"],
  micro: ["Culture & Sensitivity","Gram Stain","AFB Smear"],
  mol:   ["PCR-based Testing","Viral Load / DNA assays"],
  res:   ["Study Design & Protocols","Data Collection & Analysis"],
  well:  ["Screening Packages","Lifestyle & Nutrition Counselling"]
};

export default function Hero(){
  const [slides, setSlides] = useState([]);
  const [idx, setIdx] = useState(0);

  // load hero media (image/video)
  useEffect(() => {
    http.get("/media/hero")
      .then(r => setSlides(r.data))
      .catch(() => setSlides([]));
  }, []);

  // rotate services slowly (12s per item)
  useEffect(() => {
    const t = setInterval(() => setIdx(v => (v + 1) % SERVICE_ITEMS.length), 12000);
    return () => clearInterval(t);
  }, []);

  const current = useMemo(() => SERVICE_ITEMS[idx], [idx]);

  const BottomBar = () => (
    <div className="hero-bottombar d-flex gap-2">
      <Link to="/appointments" className="btn btn-primary btn-sm">Request Appointment</Link>
      <a href="https://facebook.com" className="btn btn-outline-light btn-sm" aria-label="Facebook"><i className="bi bi-facebook"></i></a>
      <a href="https://www.linkedin.com/company/" className="btn btn-outline-light btn-sm" aria-label="LinkedIn"><i className="bi bi-linkedin"></i></a>
      <a href="https://x.com/" className="btn btn-outline-light btn-sm" aria-label="X"><i className="bi bi-twitter-x"></i></a>
      <a href="https://instagram.com/" className="btn btn-outline-light btn-sm" aria-label="Instagram"><i className="bi bi-instagram"></i></a>
    </div>
  );

  const ServiceFlyer = () => (
    <>
      <div className="service-flyer">
        <div key={current.key} className="service-flyer-inner">
          <i className={`bi ${current.icon} me-2`}></i>
          {current.label}
        </div>
      </div>

      {/* bullet panel */}
      <div className="service-panel" key={`${current.key}-panel`}>
        <h6 className="fw-bold mb-1">{current.label} — We offer:</h6>
        <ul className="mb-0">
          {SERVICE_DETAILS[current.key]?.slice(0, 6).map(item => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </>
  );

  return (
    <div className="position-relative hero-fade">
      <div id="hero" className="carousel slide" data-bs-ride="carousel">
        <div className="carousel-inner">
          {slides.map((s, k) => (
            <div key={s.id ?? k} className={`carousel-item ${k === 0 ? "active" : ""}`}>
              {s.type === "video" ? (
                <video className="w-100" autoPlay muted loop playsInline>
                  <source src={s.path} type="video/mp4" />
                </video>
              ) : (
                <img src={s.path} className="d-block w-100" alt={s.caption || "Hero"} />
              )}
            </div>
          ))}

          {slides.length === 0 && (
            <div className="carousel-item active">
              <img src="/microscope.jpg" className="d-block w-100" alt="Hacha Labs" />
            </div>
          )}
        </div>

        {/* Controls */}
        <button className="carousel-control-prev" type="button" data-bs-target="#hero" data-bs-slide="prev">
          <span className="carousel-control-prev-icon"></span>
        </button>
        <button className="carousel-control-next" type="button" data-bs-target="#hero" data-bs-slide="next">
          <span className="carousel-control-next-icon"></span>
        </button>

        {/* Overlays */}
        <ServiceFlyer />
        <BottomBar />
      </div>
    </div>
  );
}
