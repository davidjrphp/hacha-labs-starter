const sections = [
  {
    title: "Clinical Chemistry",
    items: [
      "LFTs (full panel)",
      "RFTs (full panel)",
      "Cardiac Profile",
      "Hormonal Profile",
      "Lipid Profile",
      "RBS / FBS",
      "Electrolytes (combo)",
    ],
  },
  {
    title: "Haematology",
    items: ["FBC/CBC", "WBC Absolute Count", "Sickling Test", "ESR"],
  },
  {
    title: "Microbiology & Parasitology",
    items: [
      "Urine Routine M/C/S",
      "Stool routine M/C/S",
      "Occult Blood",
      "Semen Analysis",
      "CSF Analysis",
      "MPS",
      "CAT",
    ],
  },
  {
    title: "Molecular",
    items: ["PCR tests"],
  },
  {
    title: "Serology",
    items: ["H. Pylori", "PSA", "Hepatitis Profile (A, B & C)", "Blood Grouping"],
  },
  {
    title: "Serology",
    subtitle: "(extended)",
    items: ["Widal Test", "Rheumatoid Factor", "Syphilis Test", "Gravindex Test", "STI Profile"],
  },
  {
    title: "Research",
    items: ["Socio-based research", "Human-based research", "Adaptive research services"],
  },
  {
    title: "Wellness Programs",
    items: ["Health education", "Health promotion activities", "Nutritional consultancy"],
  },
];

const colors = ["#0ba5a4", "#0f70b7", "#e07a00", "#9333ea", "#0ba5a4", "#0f70b7", "#e07a00", "#9333ea"];

export default function Services() {
  return (
    <div className="pb-5">
      <div
        className="text-white py-5"
        style={{ background: "linear-gradient(120deg, #0f70b7, #f78f1e)" }}
      >
        <div className="container">
          <h1 className="fw-bold">Our Services</h1>
          <p className="lead mb-0">Fostering Health &amp; Wellbeing</p>
          <p className="mb-0 mt-2" style={{ maxWidth: "720px" }}>
            We offer services across screening, diagnosis, and monitoring of health problems in clinical and research
            contexts.
          </p>
        </div>
      </div>

      <div className="container py-5">
        <div className="row g-4">
          {sections.map((section, idx) => (
            <div className="col-md-6 col-lg-4" key={`${section.title}-${section.subtitle || ""}-${idx}`}>
              <div className="card h-100 shadow-sm">
                <div
                  className="card-header text-white fw-semibold"
                  style={{ background: colors[idx % colors.length] }}
                >
                  {section.title} {section.subtitle && <span className="fw-normal">{section.subtitle}</span>}
                </div>
                <div className="card-body">
                  <div className="fw-semibold mb-2">We offer:</div>
                  <ul className="mb-0 ps-3">
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
