import React from "react";
import noneLogo from "../assets/nonemember.png";
import silverLogo from "../assets/silvermember.png";
import goldLogo from "../assets/goldmember.png";
import platinumLogo from "../assets/memberplatinum.png";

const MembershipProgress = ({ point, membership }) => {
  const levels = [
    { name: "None", threshold: 0, icon: noneLogo },
    { name: "Silver", threshold: 1000, icon: silverLogo },
    { name: "Gold", threshold: 5000, icon: goldLogo },
    { name: "Platinum", threshold: 10000, icon: platinumLogo },
  ];

  const validPoint = Math.max(0, point);

  const currentLevelIndex = levels.findIndex((level) => level.name === membership);

  const nextLevel = currentLevelIndex < levels.length - 1 ? levels[currentLevelIndex + 1] : null;

  let progress;
  if (!nextLevel) {
    progress = 100;
  } else {
    progress = (validPoint / nextLevel.threshold) * 100;
  }

  const calculateSegmentWidth = () => {
    return 100 / (levels.length - 1);
  };

  const calculateProgressWidth = () => {
    if (currentLevelIndex >= levels.length - 1) return 100;

    const segmentWidth = calculateSegmentWidth();
    const fullSegments = currentLevelIndex;
    const currentSegmentProgress = (progress / 100) * segmentWidth;

    return fullSegments * segmentWidth + currentSegmentProgress;
  };

  const progressWidth = calculateProgressWidth();

  const pointsToNextLevel = nextLevel ? nextLevel.threshold - validPoint : 0;

  return (
    <div className="w-full max-w-4xl mx-auto text-gray-950">
      <div className="flex justify-between items-center relative">
        {levels.map((level, index) => (
          <div key={level.name} className="text-center z-10 -translate-x-1/1">
            <div className="flex items-center justify-center">
              <img
                src={level.icon}
                alt={level.name}
                className={`w-[2.5rem] h-[2.5rem] ${index <= currentLevelIndex ? "opacity-100" : "opacity-10"}`}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
        <div
          className="bg-orange-500 h-2 rounded-full"
          style={{ width: `${progressWidth}%` }}
        />
      </div>

      <div className="mt-2 text-center">
        {nextLevel ? (
          <p>
            {`Your point: ${validPoint}, reach ${pointsToNextLevel} more points to ${nextLevel.name}`}
          </p>
        ) : (
          <p>You have reached the highest level!</p>
        )}
      </div>
    </div>
  );
};

export default MembershipProgress;