import React, { useState } from 'react';

const calculateWeeks = (lmp: string): number | null => {
  if (!lmp) return null;
  const lmpDate = new Date(lmp);
  const today = new Date();
  const diff = today.getTime() - lmpDate.getTime();
  if (isNaN(diff) || diff < 0) return null;
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
};

const PregnancyWheel: React.FC = () => {
  const [lmp, setLmp] = useState<string>("");
  const [weeks, setWeeks] = useState<number | null>(null);

  const handleCalculate = () => {
    setWeeks(calculateWeeks(lmp));
  };

  return (
    <div style={{ padding: "1rem", maxWidth: 400 }}>
      <h2>Pregnancy Week Calculator</h2>
      <label>
        Last Menstrual Period (LMP):
        <input
          type="date"
          value={lmp}
          onChange={(e) => setLmp(e.target.value)}
          style={{ marginLeft: "0.5rem" }}
        />
      </label>
      <button onClick={handleCalculate} style={{ marginLeft: "1rem" }}>
        Calculate Weeks
      </button>
      {weeks !== null && (
        <p>
          You are approximately <strong>{weeks}</strong> weeks pregnant.
        </p>
      )}
    </div>
  );
};

export default PregnancyWheel;
