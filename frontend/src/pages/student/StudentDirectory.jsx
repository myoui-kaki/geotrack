// src/pages/student/StudentDirectory.jsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";

export default function StudentDirectory() {
  const [houses, setHouses] = useState([]);
  const [ratings, setRatings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();


  useEffect(() => {
    loadDirectory();
  }, []);


  async function loadDirectory() {
    try {
      const list = await api.student.listBoardingHouses();
      setHouses(list);


      // get reviews summary per boarding house
      const ratingData = {};

      await Promise.all(
        list.map(async (h) => {
          try {
            const reviews = await api.student.getReviews(h.id);

            const total = reviews.length;

            const average =
              total > 0
                ? (
                    reviews.reduce(
                      (sum, r) => sum + r.rating,
                      0
                    ) / total
                  ).toFixed(1)
                : null;


            ratingData[h.id] = {
              average,
              total
            };

          } catch {
            ratingData[h.id] = {
              average:null,
              total:0
            };
          }
        })
      );


      setRatings(ratingData);

    } catch(err){
      setError(err.message);
    }
    finally{
      setLoading(false);
    }
  }



  return (
    <>
      <div className="student-header">
        <div className="greet">Browse</div>
        <h2>Boarding house directory</h2>
        <p style={{ fontSize:12.5, color:"#857d6c", marginTop:6 }}>
          A "Verified" boarding house has a confirmed business permit on file with its barangay.
          "Unverified" means it has not been verified yet. "Rejected" houses (only visible to the
          student who submitted them) show the remarks from OSAS.
        </p>
      </div>


      <div className="student-body">

        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}


        <div className="card">

        {loading ? (

          <div className="loading-text">
            Loading...
          </div>


        ) : houses.length === 0 ? (

          <div className="review-empty">
            No boarding houses registered yet.
          </div>


        ) : (


          houses.map((h) => (
  <div
    className="listing-row"
    key={h.id}
    onClick={() => navigate(`/student/directory/${h.id}`, { state: h })}
    style={{ cursor:"pointer" }}
  >
    <div style={{flex:1}}>
      <div className="listing-name">{h.name}</div>

      <div className="listing-meta">
        {h.barangay}
        {h.monthly_rate ? ` - ₱${h.monthly_rate}/mo` : ""}
      </div>

      <div style={{
        marginTop:8,
        fontSize:12,
        color:"#5a8a3c",
        fontWeight:600
      }}>
         View student reviews →
      </div>

      {h.verification_status === "rejected" && h.verification_remarks && (
        <div style={{marginTop:8, padding:"8px 10px", borderRadius:8, background:"#fbe6e0",
                     color:"#8f2a08", fontSize:12, lineHeight:1.45}}>
          <b>Remarks from OSAS:</b> {h.verification_remarks}
        </div>
      )}
      {h.verification_status === "unverified" && h.verification_remarks && (
        <div style={{marginTop:8, fontSize:12, color:"#6b6457"}}>
          <b>Remarks:</b> {h.verification_remarks}
        </div>
      )}
    </div>

    <span className={`badge ${h.verification_status === "verified" ? "ok" : h.verification_status === "rejected" ? "rejected" : "pending"}`}>
      {h.verification_status === "verified" ? "Verified" : h.verification_status === "rejected" ? "Rejected" : "Unverified"}
    </span>
  </div>
))

        )}

        </div>

      </div>
    </>
  );
}