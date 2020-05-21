import React from 'react';
import RectClipGroup from './RectClipGroup';
import { curveNatural } from '@vx/curve';
import { LinePath } from '@vx/shape';

const ZoneLinePath = ({
  data,
  x,
  y,
  width,
  region,
  yScale,
}: {
  data: any[];
  x: (d: any) => number;
  y: (d: any) => number;
  width: number;
  region: any;
  yScale: (d: any) => number;
}) => {
  return (
    <RectClipGroup
      y={yScale(region.valueTo)}
      width={width}
      height={yScale(region.valueFrom) - yScale(region.valueTo)}
    >
      <LinePath data={data} x={x} y={y} curve={curveNatural} />
    </RectClipGroup>
  );
};

export default ZoneLinePath;
