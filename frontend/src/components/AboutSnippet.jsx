export default function AboutSnippet(){
  return (
    <section className="container py-5" data-aos="fade-up">
      <div className="row align-items-center g-4">
        <div className="col-lg-7">
          <h3 className="mb-3">About Our Company</h3>
          <p className="lead">
            HRDI, formerly registered on 23rd
            January 2020, and opened to the
            public 13th October 2021 is a
            people-focused, technology-driven
            Research and Medical Diagnostic
            Institute, with branches in Ndola
            and Lusaka.
            HRDI offers an extensive range of
            screening and diagnostic tests to
            support the prevention and
            management of disease in the
            health care sector.
            The Institute has an excellent
            record of assisting clinicians and
            health facilities to manage
            disease, improve and maintain
            health and wellbeing
          </p>
          <ul className="mb-3">
            <li><strong>Vision:</strong> To become a leading institute in Research and Diagnostic services.</li>
            <li><strong>Mission:</strong> To inspire hope and create solutions that promote health and well-being through integrated diagnostic practice, education, and research.</li>
            <li><strong>Motto:</strong> Fostering Health &amp; Wellbeing.</li>
          </ul>
          <a className="btn btn-outline-secondary" href="/about">Read more</a>
        </div>
        <div className="col-lg-5">
          <img className="img-fluid rounded-3 shadow-sm" src="/AifuNI.jpg" alt="HRDI" />
        </div>
      </div>
    </section>
  );
}
