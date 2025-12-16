const services = [
  {
    title: "Primary care",
    items: [
      "General Consultation",
      "Maternal & Child Health Services (MCH)",
      "Mental Health",
      "Neurology",
    ],
    color: "#0f70b7",
  },
  {
    title: "Laboratory",
    items: [
      "Clinical Chemistry",
      "Haematology",
      "Immuno-Serology",
      "Microbiology & Parasitology",
      "Hormones",
    ],
    color: "#e07a00",
  },
  {
    title: "Diagnostics & research",
    items: ["Ultrasound and ECG", "Social and Human Health Research"],
    color: "#0ba5a4",
  },
];

export default function ACMedicalCenter() {
  return (
    <div className="pb-5">
      <div className="text-white py-5" style={{ background: "linear-gradient(120deg, #0f70b7, #f78f1e)" }}>
        <div className="container">
          <h1 className="fw-bold mb-2">Assah Chipulu Medical Centre</h1>
          <p className="lead mb-0">Comprehensive clinical care, diagnostics, and community health research.</p>
          <div className="mt-3">
            <div className="small">Tel: 0979 646 633 • Email: tchabu06@gmail.com</div>
          </div>
        </div>
      </div>

      <div className="container py-5">
        <div className="row g-4">
          {services.map((section, idx) => (
            <div className="col-md-6 col-lg-4" key={`${section.title}-${idx}`}>
              <div className="card h-100 shadow-sm">
                <div className="card-header text-white fw-semibold" style={{ background: section.color }}>
                  {section.title}
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
