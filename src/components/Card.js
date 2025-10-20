import React from 'react';
import './Styles/Card.css';

// Card component similar to Chakra pattern but using CSS classes
function Card(props) {
  const { variant = 'default', children, className = '', ...rest } = props;
  
  // Build CSS classes based on variant
  const cardClasses = `card card-${variant} ${className}`.trim();
  
  return (
    <div className={cardClasses} {...rest}>
      {children}
    </div>
  );
}

export default Card;