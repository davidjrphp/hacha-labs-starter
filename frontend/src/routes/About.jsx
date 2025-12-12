import { useState } from "react";

export default function About() {
  const [expanded, setExpanded] = useState(false);

  const intro =
    "Hacha Group of Companies is a diversified conglomerate at the intersection of healthcare and agriculture. We pair a modern medical laboratory, a community-focused clinic, and sustainable agroforestry ventures to enhance quality of life, guided by a holistic vision of wellness.";

  const details =
    " Our ecosystem spans three pillars: Hacha Research & Diagnostic Institute (Hacha Labs), delivering research-grade, precise diagnostics; Assah Chipulu Medical Center, offering accessible, compassionate clinical care; and Rythy Solutions Limited, advancing sustainable forestry and cash-crop production. Together we bridge medical science, nutrition, and environmental stewardship to build resilient communities. Across every subsidiary we stand for excellence, innovation, and meaningful community impact—uplifting people, protecting the environment, and driving socio-economic growth.";

  return (
    <section className="container py-5" data-aos="fade-up">
      <div className="row align-items-center g-4">
        <div className="col-lg-7">
          <h3 className="mb-3">About Our Company</h3>
          <p className="lead">
            {expanded ? `${intro}${details}` : intro}
          </p>
          <button
            className="btn btn-outline-primary mb-3"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "Show less" : "Read more"}
          </button>

          <div className="mt-4">
            <h4 className="mb-2">Company Background</h4>
            <p className="background">
              The healthcare system in Zambia faces gaps in adequacy, equity, and efficiency, with public expenditure still
              below Abuja Declaration targets. The diagnostic market shows no dominant player, creating a conducive environment
              for reliable entrants. Demand is rising due to a dual burden of disease and persistent stock-outs in public
              laboratories. Coupled with rapid advances in diagnostic technology, this positions trusted private laboratories
              to play a pivotal role in clinical management, surveillance, and outbreak investigations.
            </p>
          </div>
        </div>
        <div className="col-lg-5">
          <img className="img-fluid rounded-3 shadow-sm" src="/AifuNI.jpg" alt="HRDI" />
        </div>
      </div>
    </section>
  );
}
