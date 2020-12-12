export function linearRegression(data: {x: number; y: number}[]): {m: number; b: number} {
  const sums = data.reduce((d1, c) => ({
      x: d1.x + c.x,
      y: d1.y + c.y
    }),
  {x: 0, y: 0});
  const avgs = {x: sums.x / data.length, y: sums.y / data.length};

  const sumErrX = data.reduce((prev, cur) => prev + Math.pow(cur.x - avgs.x, 2), 0);
  const sumErrXY = data.reduce((prev, cur) => prev + ((cur.x - avgs.x) * (cur.y - avgs.y)), 0);

  const m = sumErrXY / sumErrX;
  const b = avgs.y - (m * avgs.x);
  return {m, b};
}
