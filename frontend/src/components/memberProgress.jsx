import React from "react";
import noneLogo from '../assets/nonemember.png';
import silverLogo from '../assets/silvermember.png';
import goldLogo from '../assets/goldmember.png';
import platinumLogo from '../assets/memberplatinum.png';

const MembershipProgress = ({ point, membership }) => {
  const levels = [
    { name: "None", threshold: 0, icon: noneLogo },
    { name: "Silver", threshold: 1000000, icon: silverLogo },
    { name: "Gold", threshold: 5000000, icon: goldLogo },
    { name: "Platinum", threshold: 10000000, icon: platinumLogo },
  ];

  const currentLevelIndex = Math.max(0, levels.findIndex((level) => level.name === membership));

  const nextLevel = currentLevelIndex < levels.length - 1 ? levels[currentLevelIndex + 1] : null;

  let progress;
  if (!nextLevel) {
    progress = 100;
  } else {
    const nextThreshold = nextLevel.threshold;
    progress = Math.min(100, Math.max(0, (point / nextThreshold) * 105));
  }

  return (
    <div className="w-full max-w-4xl mx-auto text-gray-950">
      <div className="flex justify-between items-center">
        {levels.map((level, index) => (
          <div key={level.name} className="text-center ml-1">
            <img
              src={level.icon}
              alt={level.name}
              className={`w-10 h-10 ${index <= currentLevelIndex ? "opacity-100" : "opacity-20"}`}
            />
            <p className="text-sm">{level.name}</p>
          </div>
        ))}
      </div>

      <div className="ml-1.5 w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-orange-500 h-2 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-2 text-center">
        {nextLevel ? (
          <p>
            {`Your point: ${(point / 1000).toFixed(0)}, earn ${((nextLevel.threshold - point) / 1000).toFixed(0)} to reach ${nextLevel.name}`}
          </p>
        ) : (
          <p>You have reached the highest level!</p>
        )}
      </div>
    </div>
  );
};

export default MembershipProgress;