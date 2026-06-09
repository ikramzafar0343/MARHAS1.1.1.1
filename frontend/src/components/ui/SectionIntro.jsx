import React from 'react';

const SectionIntro = ({
  eyebrow,
  title,
  description,
  centered = true,
  className = '',
  titleAs: TitleTag = 'h1'
}) => (
  <header
    className={`section-intro${centered ? ' section-intro--centered' : ''}${className ? ` ${className}` : ''}`}
  >
    {eyebrow && <span className="section-intro-eyebrow">{eyebrow}</span>}
    <TitleTag className="section-intro-title">{title}</TitleTag>
    {description && <p className="section-intro-description">{description}</p>}
  </header>
);

export default SectionIntro;
