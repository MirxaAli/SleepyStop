const subwayLines = [
  "All",
  "1", "2", "3", "4", "5", "6", "7",
  "A", "C", "E",
  "B", "D", "F", "M",
  "G", "J", "Z", "L",
  "N", "Q", "R", "W",
  "S"
];

export default function RouteFilter({ selectedLine, onSelectLine }) {
  return (
    <div className="route-filter">
      <label>Filter by Subway Line</label>

      <div className="line-buttons">
        {subwayLines.map((line) => (
          <button
            key={line}
            className={selectedLine === line ? "line-button active" : "line-button"}
            onClick={() => onSelectLine(line)}
          >
            {line}
          </button>
        ))}
      </div>
    </div>
  );
}
