// export default function About(){return <div className="container py-5"><h2>About Us</h2><p>Explore our research programs.</p></div>}

export default function About(){
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
          <h3 className="mb-3">Company Background</h3>
           <p className="background">
                The Healthcare system in Zambia suffers from inadequacy,
                inequalities, and inefficiency, when compared to peer countries.
                Public expenditure on healthcare continue to average 10% of total
                government expenditure, less than the 15% minimum target set by
                the 2001 Abuja Declaration. The market scan of the medical
                diagnostic industry reveals that, there are no diagnostic companies
                with a dominant market share value. This creates a conducive
                business environment for new entrants into the sector.
                Research has shown that the diagnostic industry is expected to
                expand due to the dual burden of disease and public health
                laboratories' inability to meet demand for reliable, timely, and
                quality-assured laboratory services, as well as prolonged stockouts
                of critical laboratory commodities.
                Similarly, advancements in medical diagnostic technologies, entails
                that the industry is expected to continue to grow, and there has
                recently been a renewed appreciation of the critical role private
                medical laboratories play in supporting diagnosis and patient
                management, disease surveillance, and outbreak investigations by
                the public.
           </p>
          {/* <a className="btn btn-outline-secondary" href="/about">Read more</a> */}
        </div>
        <div className="col-lg-5">
          <img className="img-fluid rounded-3 shadow-sm" src="/AifuNI.jpg" alt="HRDI" />
        </div>
      </div>
    </section>
  );
}
