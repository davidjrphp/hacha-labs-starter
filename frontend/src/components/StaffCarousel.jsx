import { useEffect, useState } from "react";
import http from "../api/http.js";

const fallback = [
  { id:1, name:"Dr. T. Chabu", role_title:"Pathologist", photo_path:"/lab-technologist.jpg" },
  { id:2, name:"Dr. B. David", role_title:"Molecular Biologist", photo_path:"/dee.jpg" },
  { id:3, name:"Mr. N. Kameya", role_title:"Lab Technologist", photo_path:"/Kameya.png" },
  { id:4, name:"Ms.. K. Banda", role_title:"QA Lead", photo_path:"/scaled.jpg" }
];

export default function StaffCarousel(){
  const [staff,setStaff]=useState([]);
  useEffect(()=>{
    http.get('/staff')
      .then((response)=>{
        const payload = response?.data;
        if(Array.isArray(payload)){
          setStaff(payload);
        }else if(Array.isArray(payload?.data)){
          setStaff(payload.data);
        }else{
          setStaff([]);
        }
      })
      .catch(()=>setStaff([]));
  },[]);
  const data = Array.isArray(staff) && staff.length ? staff : fallback;

  return (
    <section className="bg-body-tertiary py-5" data-aos="fade-up">
      <div className="container">
        <h3 className="mb-3">Our Team</h3>
        <div className="row g-3">
          {data.map(s=>(
            <div className="col-6 col-md-3" key={s.id}>
              <div className="card h-100 text-center card-hover">
                <img src={s.photo_path} className="card-img-top" alt={s.name}/>
                <div className="card-body">
                  <h6 className="card-title mb-0">{s.name}</h6>
                  <div className="small text-muted">{s.role_title}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
