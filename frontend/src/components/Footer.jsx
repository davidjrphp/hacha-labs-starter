export default function Footer(){
  const year = new Date().getFullYear();
  return (
    <footer className="bg-body-tertiary border-top mt-5">
      <div className="container py-4">
        <div className="row g-4">
          <div className="col-md-4">
            <h6>Location</h6>
            <div className="ratio ratio-4x3 rounded overflow-hidden">
              <iframe
                src="https://maps.google.com/maps?q=Lusaka&t=&z=14&ie=UTF8&iwloc=&output=embed"
                loading="lazy" title="Map"></iframe>
            </div>
            <div className="small mt-2">Hours: Mon–Fri 08:00–17:00, Sat 09:00–13:00, Sun: Closed</div>
          </div>
          <div className="col-md-4">
            <h6>Contact</h6>
            <div>Email: info@hachalabs.com</div>
            <div>Phone: +260979646633 </div>
            <div>Location: Flat 16, block 3, Chilenje,
                off Chilimbulu Road, Opposite Chilenje Hospital,
                Lusaka, Zambia
                Hilltop Hospital, Independence Way road, Ndola,
                Zambia
                Cardinal Memorial Adam Hospital, Lusaka, Zambia 
            </div>
            <div className="mt-2 d-flex gap-2">
              <a className="btn btn-outline-secondary btn-sm" href="#"><i className="bi bi-facebook"></i></a>
              <a className="btn btn-outline-secondary btn-sm" href="#"><i className="bi bi-twitter-x"></i></a>
              <a className="btn btn-outline-secondary btn-sm" href="#"><i className="bi bi-instagram"></i></a>
              <a className="btn btn-outline-secondary btn-sm" href="#"><i className="bi bi-linkedin"></i></a>
            </div>
          </div>
          <div className="col-md-4">
            <h6>Partners</h6>
            <ul className="list-unstyled small">
              <li>Ministry of Health</li>
              <li>University Teaching Hospital</li>
            </ul>
            <div className="small mt-3">
              <a href="#">Terms & Conditions</a>
            </div>
          </div>
        </div>
        <hr/>
        <div className="d-flex justify-content-between small">
          <span>© {year} Hacha Labs. All rights reserved.</span>
          <span>Powered By: Copy Place Technologies</span>
          <span>Fostering Health & Wellbeing</span>
        </div>
      </div>
    </footer>
  );
}
