
'use client'

import React from 'react';
import './StarBorder.css';

const StarBorder = ({ children }) => {
  return (
    <div className="star-border-container">
      <div className="inner-content">
        {children}
      </div>
    </div>
  );
};

export default StarBorder;
