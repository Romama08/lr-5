import React from 'react';
import './Organizers.css';

function Organizers() {
  return (
    <main className="organizers-main" style={{ padding: '20px' }}>
      <h1>Організатори заходів</h1>
      <div className="about-card">
        <p>Ми співпрацюємо з найкращими агентствами, щоб забезпечити вам незабутні враження.</p>
        <ul>
          <li><strong>Kyiv Concert Agency</strong> — лідер ринку столиці.</li>
          <li><strong>Art Space Group</strong> — організатори мистецьких виставок.</li>
          <li><strong>Smile Production</strong> — стендап та гумористичні шоу.</li>
        </ul>
      </div>
    </main>
  );
}

export default Organizers;