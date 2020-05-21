import React from 'react';
import moment from 'moment';
import { isDate } from 'lodash';
import { min as d3min, max as d3max } from 'd3-array';
import { AxisBottom, AxisLeft } from '@vx/axis';
import { localPoint } from '@vx/event';
import { GridRows } from '@vx/grid';
import { Group } from '@vx/group';
import { ParentSize } from '@vx/responsive';
import { scaleLinear, scaleTime } from '@vx/scale';
import { useTooltip } from '@vx/tooltip';
import { Column } from 'common/models/Projection';
import { LevelInfoMap } from 'common/level';
import RectClipGroup from './RectClipGroup';
import BoxedAnnotation from './BoxedAnnotation';
import HoverOverlay from './HoverOverlay';
import ZoneAnnotation from './ZoneAnnotation';
import ZoneLinePath from './ZoneLinePath';
import * as Style from './Charts.style';
import {
  getChartRegions,
  computeTickPositions,
  last,
  formatPercent,
  getZoneByValue,
} from './utils';

type Point = Omit<Column, 'y'> & {
  y: number;
};

const getDate = (d: Point) => new Date(d.x);
const getY = (d: Point) => d.y;

const hasData = (d: any) => isDate(getDate(d)) && Number.isFinite(getY(d));

const getTooltipTitle = (d: Point): string =>
  moment(getDate(d)).format('dddd, MMM D, YYYY');

const ChartZones = ({
  width,
  height,
  columnData,
  zones,
  marginTop = 5,
  marginBottom = 40,
  marginLeft = 40,
  marginRight = 5,
  capY,
}: {
  width: number;
  height: number;
  columnData: Point[];
  zones: LevelInfoMap;
  capY: number;
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
}) => {
  const chartWidth = width - marginLeft - marginRight;
  const chartHeight = height - marginTop - marginBottom;

  const data: Point[] = columnData.filter(hasData);

  const minDate = d3min(data, getDate) || new Date('2020-01-01');
  const maxDate = moment().add(2, 'weeks').toDate();

  const xScale = scaleTime({
    domain: [minDate, maxDate],
    range: [0, chartWidth],
  });

  const yDataMin = 0;
  const yDataMax = d3max(data, getY) || 1;
  const yMax = Math.min(capY, yDataMax);

  const yScale = scaleLinear({
    domain: [yDataMin, yMax],
    range: [chartHeight, 0],
  });

  const getXCoord = (d: Point) => xScale(getDate(d));
  const getYCoord = (d: Point) => yScale(getY(d));

  const regions = getChartRegions(yDataMin, yDataMax, zones);
  const yTicks = computeTickPositions(yDataMin, yMax, zones);

  const lastPoint = last(data);
  const lastPointY = getY(lastPoint);
  const lastPointZone = getZoneByValue(lastPointY, zones);

  const { tooltipData, tooltipOpen, showTooltip, hideTooltip } = useTooltip<
    Point
  >();

  const onMouseOver = (
    event: React.MouseEvent<SVGPathElement, MouseEvent>,
    d: Point,
  ) => {
    // @ts-ignore - typing bug
    const coords = localPoint(event.target.ownerSVGElement, event);
    if (!coords) return;
    showTooltip({
      tooltipLeft: coords.x,
      tooltipTop: coords.y,
      tooltipData: d,
    });
  };

  return (
    <Style.PositionRelative>
      <svg width={width} height={height}>
        <Group left={marginLeft} top={marginTop}>
          <RectClipGroup width={chartWidth} height={chartHeight}>
            {regions.map((region, i) => (
              <Group key={`chart-region-${i}`}>
                <Style.SeriesLine stroke={region.color}>
                  <ZoneLinePath
                    data={data}
                    x={getXCoord}
                    y={getYCoord}
                    region={region}
                    width={chartWidth}
                    yScale={yScale}
                  />
                </Style.SeriesLine>
                <ZoneAnnotation
                  color={region.color}
                  name={region.name}
                  isActive={lastPointZone.name === region.name}
                  x={xScale(maxDate) - 10}
                  y={yScale(0.5 * (region.valueFrom + region.valueTo))}
                />
              </Group>
            ))}
          </RectClipGroup>
          <Style.LineGrid>
            <GridRows width={chartWidth} scale={yScale} tickValues={yTicks} />
          </Style.LineGrid>
          <Style.TextAnnotation>
            <BoxedAnnotation
              x={getXCoord(lastPoint) + 30}
              y={getYCoord(lastPoint)}
              text={formatPercent(lastPointY, 1)}
            />
          </Style.TextAnnotation>
          <Style.Axis>
            <AxisBottom
              top={chartHeight}
              scale={xScale}
              numTicks={Math.round(chartWidth / 100)}
            />
          </Style.Axis>
          <Style.Axis>
            <AxisLeft
              top={marginTop}
              scale={yScale}
              tickValues={yTicks}
              hideAxisLine
              hideTicks
              hideZero
              tickFormat={(num: number) => formatPercent(num, 0)}
            />
          </Style.Axis>
          {tooltipOpen && tooltipData && (
            <Style.CircleMarker
              cx={getXCoord(tooltipData)}
              cy={getYCoord(tooltipData)}
              r={6}
              fill={getZoneByValue(getY(tooltipData), zones).color}
            />
          )}
          <HoverOverlay
            width={chartWidth}
            height={chartHeight}
            data={data}
            x={getXCoord}
            y={getYCoord}
            onMouseOver={onMouseOver}
            onMouseOut={hideTooltip}
          />
        </Group>
      </svg>
      {tooltipOpen && tooltipData && (
        <Style.Tooltip
          style={{
            top: marginTop + getYCoord(tooltipData),
            left: marginLeft + getXCoord(tooltipData),
          }}
        >
          <Style.TooltipTitle>
            {getTooltipTitle(tooltipData)}
          </Style.TooltipTitle>
          <div>{`${formatPercent(getY(tooltipData), 1)}`}</div>
        </Style.Tooltip>
      )}
    </Style.PositionRelative>
  );
};

const ChartZoneAutosize = ({
  height = 400,
  columnData,
  zones,
  capY = 0.4,
}: {
  height?: number;
  columnData: Point[];
  zones: LevelInfoMap;
  capY?: number;
}) => (
  <Style.ChartContainer>
    <ParentSize>
      {({ width }) => {
        return (
          <ChartZones
            width={width}
            height={height}
            columnData={columnData}
            zones={zones}
            capY={capY}
          />
        );
      }}
    </ParentSize>
  </Style.ChartContainer>
);

export default ChartZoneAutosize;
