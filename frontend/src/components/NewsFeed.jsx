import { useEffect, useState } from "react";
import http from "../api/http.js";
export default function NewsFeed(){
  const [items,setItems]=useState([]);
  useEffect(()=>{ http.get('/news').then(r=>setItems(r.data)); },[]);
  return (
    <section className="container py-5" data-aos="fade-up">
      <h3 className="mb-3">Latest News</h3>
      <div className="row g-3">
        {items.map(n=>(
          <div className="col-md-4" key={n.id}>
            <div className="card h-100 card-hover">
              {n.cover_path && <img src={n.cover_path} className="card-img-top" alt="cover"/>}
              <div className="card-body">
                <h5 className="card-title">{n.title}</h5>
                <p className="card-text small">{n.excerpt}...</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="text-center mt-3">
        <a className="btn btn-outline-primary btn-sm" href="#">View more</a>
      </div>
    </section>
  );
}
