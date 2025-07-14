import React from 'react';

type CustomSvgIconProps = {
  iconName: string;
  className?: string;
  style?: React.CSSProperties;
};

export function CustomSvgIcon({ iconName, className = '', style }: CustomSvgIconProps) {
  return (
    <img 
      src={`/Кокжиек иконки SVG/${iconName}.svg`}
      alt={iconName}
      className={className}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        ...style
      }}
    />
  );
}